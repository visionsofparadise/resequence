import { ResequenceError } from "../error";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { ScheduleContext } from "../rendering/schedule-context";
import { ticksToSeconds } from "../rendering/ticks-to-seconds";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedNote } from "./pattern";

export type AutomationCurve = "linear" | "exponential" | "step";

export interface AutomationPoint {
	readonly time: Duration;
	readonly value: number;
	readonly curve?: AutomationCurve;
}

interface ResolvedPoint {
	readonly timeTicks: number;
	readonly value: number;
	readonly curve?: AutomationCurve;
}

export class AutomatePattern implements Pattern {
	readonly type = "automate" as const;
	readonly durationTicks: number;
	readonly paths: ReadonlyArray<string>;
	readonly envelope: ReadonlyArray<ResolvedPoint>;

	constructor(
		readonly name: string,
		paths: string | ReadonlyArray<string>,
		points: ReadonlyArray<AutomationPoint>,
	) {
		this.paths = typeof paths === "string" ? [paths] : paths;

		if (points.length === 0) {
			throw new ResequenceError('EMPTY_AUTOMATION_POINTS', 'automate(): points array must not be empty');
		}

		this.envelope = points.map((point) => ({
			timeTicks: resolveDuration(point.time),
			value: point.value,
			curve: point.curve,
		}));

		this.durationTicks = this.envelope.length > 0 ? Math.max(...this.envelope.map((point) => point.timeTicks)) : 0;

		for (const path of this.paths) {
			const segments = path.split(".");

			if (segments.length < 3) {
				throw new ResequenceError('INVALID_AUTOMATION_PATH', `Automation path must have at least 3 segments (instrumentName.effectKey.property), got: ${path}`);
			}
		}
	}

	transpose(): this {
		return this;
	}

	reverse(): AutomatePattern {
		const duration = this.durationTicks;
		const reversedPoints: ReadonlyArray<AutomationPoint> = this.envelope.map((point) => ({
			time: (duration - point.timeTicks) as Duration,
			value: point.value,
			curve: point.curve,
		}));

		return new AutomatePattern(this.name, this.paths, reversedPoints);
	}

	validate(context: ValidateContext): void {
		context.automationPaths.push({ name: this.name, paths: [...this.paths] });
	}

	getMidi(): Array<PositionedNote> {
		return [];
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		for (const path of this.paths) {
			const param = resolveAudioParam(path, context);
			if (!param) continue;

			for (const point of this.envelope) {
				const absoluteTicks = offsetTicks + point.timeTicks;
				if (absoluteTicks < context.fromTicks || absoluteTicks > context.toTicks) continue;

				const timeSeconds = ticksToSeconds(absoluteTicks, context.tempo);
				const curve = point.curve ?? "step";

				if (curve === "step") {
					param.setValueAtTime(point.value, timeSeconds);
				} else if (curve === "linear") {
					param.linearRampToValueAtTime(point.value, timeSeconds);
				} else {
					param.exponentialRampToValueAtTime(Math.max(point.value, 1e-6), timeSeconds);
				}
			}
		}
	}
}

function resolveAudioParam(path: string, context: ScheduleContext): AudioParam | undefined {
	const segments = path.split(".");
	if (segments.length < 3) return undefined;

	const instrumentName = segments[0]!;
	const effectKey = segments[1]!;
	const property = segments[2]!;

	const entry = context.effectsMap[instrumentName];
	if (!entry) return undefined;

	const node = entry.nodes[effectKey];
	if (!node) return undefined;

	const param: unknown = (node as unknown as Record<string, unknown>)[property];
	if (!param || typeof param !== "object" || !("setValueAtTime" in param)) return undefined;

	return param as AudioParam;
}

export function automate(name: string, paths: string | ReadonlyArray<string>, points: ReadonlyArray<AutomationPoint>): AutomatePattern {
	return new AutomatePattern(name, paths, points);
}
