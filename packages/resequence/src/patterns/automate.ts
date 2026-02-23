import { get } from "lodash";
import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import { ticksToSeconds } from "../rendering/ticks-to-seconds";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedNote } from "./pattern";

export type KeyframeCurve = "linear" | "exponential" | "step";

export interface Keyframe {
	readonly time: Duration;
	readonly value: number;
	readonly curve?: KeyframeCurve;
}

interface ResolvedKeyframe {
	readonly timeTicks: number;
	readonly value: number;
	readonly curve?: KeyframeCurve;
}

export class AutomatePattern implements Pattern {
	readonly type = "automate" as const;
	readonly durationTicks: number;
	readonly paths: ReadonlyArray<string>;
	readonly envelope: ReadonlyArray<ResolvedKeyframe>;

	constructor(
		readonly name: string,
		paths: string | ReadonlyArray<string>,
		keyframes: ReadonlyArray<Keyframe>,
	) {
		this.paths = typeof paths === "string" ? [paths] : paths;

		if (keyframes.length === 0) {
			throw new ResequenceError("EMPTY_KEYFRAMES", "automate(): keyframes array must not be empty");
		}

		this.envelope = keyframes.map((keyframe) => ({
			timeTicks: resolveDuration(keyframe.time),
			value: keyframe.value,
			curve: keyframe.curve,
		}));

		this.durationTicks = this.envelope.length > 0 ? Math.max(...this.envelope.map((point) => point.timeTicks)) : 0;

		for (const path of this.paths) {
			const segments = path.split(".");

			if (segments.length < 3) {
				throw new ResequenceError("INVALID_AUTOMATION_PATH", `Automation path must have at least 3 segments (instrumentName.effectKey.property), got: ${path}`);
			}
		}
	}

	transpose(): this {
		return this;
	}

	reverse(): AutomatePattern {
		const duration = this.durationTicks;

		const reversedKeyframes: ReadonlyArray<Keyframe> = this.envelope.map((keyframe) => ({
			time: (duration - keyframe.timeTicks) as Duration,
			value: keyframe.value,
			curve: keyframe.curve,
		}));

		return new AutomatePattern(this.name, this.paths, reversedKeyframes);
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

			for (const keyframe of this.envelope) {
				const absoluteTicks = offsetTicks + keyframe.timeTicks;

				if (absoluteTicks < context.fromTicks || absoluteTicks > context.toTicks) continue;

				const timeSeconds = ticksToSeconds(absoluteTicks, context.tempo);
				const curve = keyframe.curve ?? "step";

				if (curve === "step") {
					param.setValueAtTime(keyframe.value, timeSeconds);
				} else if (curve === "linear") {
					param.linearRampToValueAtTime(keyframe.value, timeSeconds);
				} else {
					param.exponentialRampToValueAtTime(Math.max(keyframe.value, 1e-6), timeSeconds);
				}
			}
		}
	}
}

function resolveAudioParam(path: string, context: ScheduleContext): AudioParam | undefined {
	const param: unknown = get(context.effectsMap, path);

	if (!param || typeof param !== "object" || !("setValueAtTime" in param)) return undefined;

	return param as AudioParam;
}

export function automate(name: string, paths: string | ReadonlyArray<string>, keyframes: ReadonlyArray<Keyframe>): AutomatePattern {
	return new AutomatePattern(name, paths, keyframes);
}
