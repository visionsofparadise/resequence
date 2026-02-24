import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import { ticksToSeconds } from "../rendering/ticks-to-seconds";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { Lfo } from "../utils/lfo";
import { scheduleLfo } from "../utils/lfo";
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
	readonly source: ReadonlyArray<ResolvedKeyframe> | Lfo;

	constructor(
		readonly name: string,
		paths: string | ReadonlyArray<string>,
		source: ReadonlyArray<Keyframe> | Lfo,
	) {
		this.paths = typeof paths === "string" ? [paths] : paths;

		if (Array.isArray(source)) {
			const keyframes = source as ReadonlyArray<Keyframe>;

			if (keyframes.length === 0) {
				throw new ResequenceError("EMPTY_KEYFRAMES", "automate(): keyframes array must not be empty");
			}

			const resolved = keyframes.map((keyframe) => ({
				timeTicks: resolveDuration(keyframe.time),
				value: keyframe.value,
				curve: keyframe.curve,
			}));

			this.source = resolved;
			this.durationTicks = Math.max(...resolved.map((point) => point.timeTicks));
		} else {
			this.source = source as Lfo;
			this.durationTicks = 0;
		}

		for (const path of this.paths) {
			const segments = path.split(".");

			if (segments.length < 3) {
				throw new ResequenceError("INVALID_AUTOMATION_PATH", `Automation path must have at least 3 segments (instrumentName.effectKey.property), got: ${path}`);
			}
		}
	}

	get envelope(): ReadonlyArray<ResolvedKeyframe> {
		if (Array.isArray(this.source)) return this.source as ReadonlyArray<ResolvedKeyframe>;
		return [];
	}

	transpose(): this {
		return this;
	}

	reverse(): AutomatePattern {
		if (!Array.isArray(this.source)) return this;

		const duration = this.durationTicks;
		const reversedKeyframes: ReadonlyArray<Keyframe> = (this.source as ReadonlyArray<ResolvedKeyframe>).map((keyframe) => ({
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

	setup(context: ScheduleContext): void {
		for (const path of this.paths) {
			const constant = context.audioContext.createConstantSource();
			context.driverMap.set(path, constant);

			if (Array.isArray(this.source)) {
				const keyframes = this.source as ReadonlyArray<ResolvedKeyframe>;

				for (const keyframe of keyframes) {
					const timeSeconds = ticksToSeconds(keyframe.timeTicks, context.tempo);
					const curve = keyframe.curve ?? "step";

					if (curve === "step") {
						constant.offset.setValueAtTime(keyframe.value, timeSeconds);
					} else if (curve === "linear") {
						constant.offset.linearRampToValueAtTime(keyframe.value, timeSeconds);
					} else {
						constant.offset.exponentialRampToValueAtTime(Math.max(keyframe.value, 1e-6), timeSeconds);
					}
				}

				constant.start(0);
			} else {
				const lfo = this.source as Lfo;
				constant.offset.value = 0;
				scheduleLfo(lfo, constant.offset, context.audioContext, 0, Infinity, 1, context.tempo);
				constant.start(0);
			}
		}
	}

	schedule(_offsetTicks: number, _context: ScheduleContext): void {
		// no-op: automation is fully scheduled in setup()
	}

	teardown(context: ScheduleContext): void {
		for (const path of this.paths) {
			const constant = context.driverMap.get(path);
			if (constant) {
				try { constant.stop(); } catch { /* already stopped */ }
				constant.disconnect();
			}
			context.driverMap.delete(path);
		}
	}
}

export function automate(name: string, paths: string | ReadonlyArray<string>, source: ReadonlyArray<Keyframe> | Lfo): AutomatePattern {
	return new AutomatePattern(name, paths, source);
}
