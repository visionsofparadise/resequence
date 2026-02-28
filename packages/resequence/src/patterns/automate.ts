import type { AbsoluteKeyframe } from "../automation/utils";
import { evaluateAt, firstPointAt, schedulePointKeyframe } from "../automation/utils";
import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import type { TempoMap } from "../rendering/tempo-map";
import { beatsToSeconds } from "../rendering/tempo-map";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { Lfo } from "../utils/lfo";
import type { ValidateContext } from "../validate";
import type { PatternNode } from "./pattern";
import { Pattern } from "./pattern";

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

export interface ResolvedKeyframe {
	readonly kind: "point";
	readonly timeBeats: number;
	readonly value: number;
	readonly curve?: KeyframeCurve;
}

export interface ResolvedCurveKeyframe {
	readonly kind: "curve";
	readonly timeBeats: number;
	readonly durationBeats: number;
	readonly values: Float32Array;
}

export type AnyResolvedKeyframe = ResolvedKeyframe | ResolvedCurveKeyframe;

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

export class AutomatePattern extends Pattern {
	constructor(
		readonly name: string,
		readonly paths: ReadonlyArray<string>,
		readonly source: ReadonlyArray<AnyResolvedKeyframe> | Lfo,
		node: PatternNode,
	) {
		super(node);
	}

	get envelope(): ReadonlyArray<AnyResolvedKeyframe> {
		if (Array.isArray(this.source)) return this.source as ReadonlyArray<AnyResolvedKeyframe>;
		return [];
	}

	setup(context: ScheduleContext): void {
		for (const path of this.paths) {
			const constant = context.audioContext.createConstantSource();
			context.driverMap.set(path, constant);
			constant.offset.value = 0;
			constant.start(0);
		}
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (!Array.isArray(this.source)) {
			this.scheduleLfo(offsetBeats, context);
			return;
		}

		if (offsetBeats + this.endBeat <= context.fromBeats || offsetBeats + this.startBeat >= context.toBeats) return;

		const envelope = this.source as ReadonlyArray<AnyResolvedKeyframe>;
		if (envelope.length === 0) return;

		const absoluteKeyframes: Array<AbsoluteKeyframe> = envelope.map((kf) => {
			if (kf.kind === "curve") {
				return { kind: "curve" as const, beat: offsetBeats + kf.timeBeats, durationBeats: kf.durationBeats, values: kf.values };
			}
			return { kind: "point" as const, beat: offsetBeats + kf.timeBeats, value: kf.value, curve: kf.curve };
		});

		const clipEndBeat = offsetBeats + (this.endBeat - this.startBeat);
		const evalBeat = Math.max(context.fromBeats, offsetBeats);
		const initialValue = evaluateAt(absoluteKeyframes, evalBeat);
		const evalSeconds = beatsToSeconds(evalBeat, context.tempoMap);

		for (const path of this.paths) {
			const driver = context.driverMap.get(path);
			if (!driver) continue;

			driver.offset.setValueAtTime(initialValue, evalSeconds);

			for (const kf of absoluteKeyframes) {
				if (kf.beat < context.fromBeats || kf.beat >= context.toBeats) continue;

				const timeSeconds = beatsToSeconds(kf.beat, context.tempoMap);

				if (kf.kind === "curve") {
					const endSeconds = beatsToSeconds(kf.beat + kf.durationBeats, context.tempoMap);
					driver.offset.setValueCurveAtTime(kf.values, timeSeconds, endSeconds - timeSeconds);
				} else {
					schedulePointKeyframe(driver.offset, kf, timeSeconds);
				}
			}

			if (clipEndBeat > context.toBeats) {
				const nextKf = firstPointAt(absoluteKeyframes, context.toBeats);
				if (nextKf) {
					const curve = nextKf.curve ?? "step";
					if (curve !== "step") {
						const value = evaluateAt(absoluteKeyframes, context.toBeats);
						const toSeconds = beatsToSeconds(context.toBeats, context.tempoMap);
						if (curve === "linear") {
							driver.offset.linearRampToValueAtTime(value, toSeconds);
						} else {
							driver.offset.exponentialRampToValueAtTime(Math.max(value, 1e-6), toSeconds);
						}
					}
				}
			}
		}
	}

	private scheduleLfo(offsetBeats: number, context: ScheduleContext): void {
		const lfo = this.source as Lfo;

		if (offsetBeats >= context.toBeats) return;

		const lfoStartSeconds = beatsToSeconds(offsetBeats, context.tempoMap);
		const effectiveStartSeconds = lfoStartSeconds + lfo.delay;
		const windowStartSeconds = beatsToSeconds(context.fromBeats, context.tempoMap);
		const windowEndSeconds = beatsToSeconds(context.toBeats, context.tempoMap);

		if (windowEndSeconds <= effectiveStartSeconds) return;

		const freqHz = lfoFrequencyHz(lfo, offsetBeats, context.tempoMap);
		if (freqHz <= 0) return;

		const elapsedSeconds = Math.max(0, windowStartSeconds - effectiveStartSeconds);
		const phase = (2 * Math.PI * freqHz * elapsedSeconds) % (2 * Math.PI);
		const phaseSeconds = phase / (2 * Math.PI) / freqHz;

		const oscStartSeconds = Math.max(effectiveStartSeconds, windowStartSeconds - phaseSeconds);

		for (const path of this.paths) {
			const driver = context.driverMap.get(path);
			if (!driver) continue;

			const osc = context.audioContext.createOscillator();
			osc.type = lfo.shape;
			osc.frequency.value = freqHz;

			scheduleLfoFrequencyUpdates(lfo, osc.frequency, offsetBeats, context);

			const depthGain = context.audioContext.createGain();
			const fullDepth = lfo.value;

			if (lfo.attack > 0 && windowStartSeconds < effectiveStartSeconds + lfo.attack) {
				depthGain.gain.setValueAtTime(0, effectiveStartSeconds);
				depthGain.gain.linearRampToValueAtTime(fullDepth, effectiveStartSeconds + lfo.attack);
			} else {
				depthGain.gain.value = fullDepth;
			}

			osc.connect(depthGain);
			depthGain.connect(driver.offset);
			osc.start(oscStartSeconds);
			osc.stop(windowEndSeconds);
		}
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

	clone(overrides: Partial<PatternNode>): AutomatePattern {
		return new AutomatePattern(
			this.name,
			this.paths,
			this.source,
			this.overrideNode(overrides),
		);
	}

	validate(context: ValidateContext): void {
		context.automationPaths.push({ name: this.name, paths: [...this.paths] });
	}
}

export function automate(name: string, paths: string | ReadonlyArray<string>, source: ReadonlyArray<AnyKeyframe> | Lfo): AutomatePattern {
	const resolvedPaths = typeof paths === "string" ? [paths] : [...paths];

	for (const path of resolvedPaths) {
		if (path === "tempo") {
			throw new ResequenceError("INVALID_AUTOMATION_PATH", `automate() cannot target "tempo". Use tempo() with keyframes instead.`);
		}

		const segments = path.split(".");

		if (segments.length < 2) {
			throw new ResequenceError("INVALID_AUTOMATION_PATH", `Automation path must be nodeId.property, got: ${path}`);
		}
	}

	if (Array.isArray(source)) {
		const keyframes = source as ReadonlyArray<AnyKeyframe>;

		if (keyframes.length === 0) {
			throw new ResequenceError("EMPTY_KEYFRAMES", "automate(): keyframes array must not be empty");
		}

		const resolved = keyframes.map(resolveKeyframe);
		const endBeat = Math.max(...resolved.map((point) => point.timeBeats));

		return new AutomatePattern(name, resolvedPaths, resolved, { notes: [], children: [], startBeat: 0, endBeat });
	}

	return new AutomatePattern(name, resolvedPaths, source as Lfo, { notes: [], children: [], startBeat: 0, endBeat: 0 });
}

function lfoFrequencyHz(lfo: Lfo, offsetBeats: number, tempoMap: TempoMap): number {
	if (lfo.frequency !== undefined) return lfo.frequency;
	if (lfo.speedBeats === undefined) return 0;

	const bpm = bpmAtBeat(offsetBeats, tempoMap);
	return (1 / lfo.speedBeats) * (bpm / 60);
}

function bpmAtBeat(beat: number, tempoMap: TempoMap): number {
	let bpm = 120;
	for (const point of tempoMap) {
		if (point.beat > beat) break;
		bpm = point.bpm;
	}
	return bpm;
}

function scheduleLfoFrequencyUpdates(lfo: Lfo, freqParam: AudioParam, offsetBeats: number, context: ScheduleContext): void {
	if (lfo.frequency !== undefined || lfo.speedBeats === undefined) return;

	let prevBpm = bpmAtBeat(offsetBeats, context.tempoMap);

	for (const point of context.tempoMap) {
		if (point.beat <= context.fromBeats) {
			prevBpm = point.bpm;
			continue;
		}
		if (point.beat >= context.toBeats) break;

		if (point.bpm !== prevBpm) {
			const hz = (1 / lfo.speedBeats) * (point.bpm / 60);
			const timeSeconds = beatsToSeconds(point.beat, context.tempoMap);
			freqParam.setValueAtTime(hz, timeSeconds);
			prevBpm = point.bpm;
		}
	}
}
