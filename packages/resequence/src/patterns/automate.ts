import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import { beatsToSeconds } from "../rendering/tempo-map";
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

export interface CurveKeyframe {
	readonly time: Duration;
	readonly duration: Duration;
	readonly values: Float32Array;
}

export type AnyKeyframe = Keyframe | CurveKeyframe;

interface ResolvedKeyframe {
	readonly kind: "point";
	readonly timeBeats: number;
	readonly value: number;
	readonly curve?: KeyframeCurve;
}

interface ResolvedCurveKeyframe {
	readonly kind: "curve";
	readonly timeBeats: number;
	readonly durationBeats: number;
	readonly values: Float32Array;
}

type AnyResolvedKeyframe = ResolvedKeyframe | ResolvedCurveKeyframe;

function resolveKeyframe(keyframe: AnyKeyframe): AnyResolvedKeyframe {
	if ("values" in keyframe) {
		return {
			kind: "curve",
			timeBeats: resolveDuration(keyframe.time),
			durationBeats: resolveDuration(keyframe.duration),
			values: keyframe.values,
		};
	}

	return {
		kind: "point",
		timeBeats: resolveDuration(keyframe.time),
		value: keyframe.value,
		curve: keyframe.curve,
	};
}

export class AutomatePattern implements Pattern {
	readonly type = "automate" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote> = [];
	readonly paths: ReadonlyArray<string>;
	readonly source: ReadonlyArray<AnyResolvedKeyframe> | Lfo;

	constructor(
		readonly name: string,
		paths: string | ReadonlyArray<string>,
		source: ReadonlyArray<AnyKeyframe> | Lfo,
	) {
		this.paths = typeof paths === "string" ? [paths] : paths;

		if (Array.isArray(source)) {
			const keyframes = source;

			if (keyframes.length === 0) {
				throw new ResequenceError("EMPTY_KEYFRAMES", "automate(): keyframes array must not be empty");
			}

			const resolved = keyframes.map(resolveKeyframe);

			this.source = resolved;
			this.durationBeats = Math.max(...resolved.map((point) => point.timeBeats));
		} else {
			this.source = source as Lfo;
			this.durationBeats = 0;
		}

		for (const path of this.paths) {
			const segments = path.split(".");

			if (segments.length < 2) {
				throw new ResequenceError("INVALID_AUTOMATION_PATH", `Automation path must be nodeId.property, got: ${path}`);
			}
		}
	}

	get envelope(): ReadonlyArray<AnyResolvedKeyframe> {
		if (Array.isArray(this.source)) return this.source as ReadonlyArray<AnyResolvedKeyframe>;

		return [];
	}

	validate(context: ValidateContext): void {
		context.automationPaths.push({ name: this.name, paths: [...this.paths] });
	}

	setup(context: ScheduleContext): void {
		for (const path of this.paths) {
			const constant = context.audioContext.createConstantSource();
			context.driverMap.set(path, constant);

			if (Array.isArray(this.source)) {
				const keyframes = this.source as ReadonlyArray<AnyResolvedKeyframe>;

				for (const keyframe of keyframes) {
					const timeSeconds = beatsToSeconds(keyframe.timeBeats, context.tempoMap);

					if (keyframe.kind === "curve") {
						const durationSeconds = beatsToSeconds(keyframe.durationBeats, context.tempoMap);
						constant.offset.setValueCurveAtTime(keyframe.values, timeSeconds, durationSeconds);
					} else {
						const curve = keyframe.curve ?? "step";

						if (curve === "step") {
							constant.offset.setValueAtTime(keyframe.value, timeSeconds);
						} else if (curve === "linear") {
							constant.offset.linearRampToValueAtTime(keyframe.value, timeSeconds);
						} else {
							constant.offset.exponentialRampToValueAtTime(Math.max(keyframe.value, 1e-6), timeSeconds);
						}
					}
				}

				constant.start(0);
			} else {
				const lfo = this.source as Lfo;
				constant.offset.value = 0;
				scheduleLfo(lfo, constant.offset, context.audioContext, 0, Infinity, 1, context.tempoMap);
				constant.start(0);
			}
		}
	}

	prepare(_offsetBeats: number, _context: ScheduleContext): void {
		return;
	}

	schedule(_offsetBeats: number, _context: ScheduleContext): void {
		return;
	}

	teardown(context: ScheduleContext): void {
		for (const path of this.paths) {
			const constant = context.driverMap.get(path);

			if (constant) {
				try {
					constant.stop();
				} catch {
					/* already stopped */
				}

				constant.disconnect();
			}

			context.driverMap.delete(path);
		}
	}
}

export function automate(name: string, paths: string | ReadonlyArray<string>, source: ReadonlyArray<AnyKeyframe> | Lfo): AutomatePattern {
	return new AutomatePattern(name, paths, source);
}
