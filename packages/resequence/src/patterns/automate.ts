import type { Duration } from "../duration";
import { resolveDuration } from "../duration";
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

		this.envelope = points.map((point) => ({
			timeTicks: resolveDuration(point.time),
			value: point.value,
			curve: point.curve,
		}));

		this.durationTicks = this.envelope.length > 0 ? Math.max(...this.envelope.map((point) => point.timeTicks)) : 0;

		for (const path of this.paths) {
			const segments = path.split(".");

			if (segments.length < 3) {
				throw new Error(`Automation path must have at least 3 segments (instrumentName.effectKey.property), got: ${path}`);
			}
		}
	}

	transpose(): this {
		return this;
	}

	reverse(): AutomatePattern {
		if (this.envelope.length === 0) {
			return new AutomatePattern(this.name, this.paths, []);
		}

		const duration = this.durationTicks;
		const reversedPoints: ReadonlyArray<AutomationPoint> = this.envelope.map((point) => ({
			time: (duration - point.timeTicks) as Duration,
			value: point.value,
			curve: point.curve,
		}));

		return new AutomatePattern(this.name, this.paths, reversedPoints);
	}

	getNotes(): Array<PositionedNote> {
		return [];
	}
}

export function automate(name: string, paths: string | ReadonlyArray<string>, points: ReadonlyArray<AutomationPoint>): AutomatePattern {
	return new AutomatePattern(name, paths, points);
}
