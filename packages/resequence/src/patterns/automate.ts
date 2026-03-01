import type { Keyframe } from "../automation/keyframe";
import { evaluateAt, scheduleKeyframes } from "../automation/keyframe";
import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import { beatsToSeconds } from "../rendering/tempo-map";
import type { Lfo } from "../utils/lfo";
import type { ValidateContext } from "../validate";
import type { PatternProperties } from "./pattern";
import { Pattern } from "./pattern";

export interface AutomateProperties extends PatternProperties {
	readonly name: string;
	readonly paths: ReadonlyArray<string>;
	readonly source: ReadonlyArray<Keyframe> | Lfo;
}

export class AutomatePattern extends Pattern {
	constructor(readonly properties: AutomateProperties) {
		super(properties);
	}

	async setup(context: ScheduleContext): Promise<void> {
		for (const path of this.properties.paths) {
			const constant = context.audioContext.createConstantSource();
			context.driverMap.set(path, constant);
			constant.offset.value = 0;
			constant.start(0);
		}

		await super.setup(context);
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (!Array.isArray(this.properties.source)) {
			this.scheduleLfo(offsetBeats, context);
			return;
		}

		if (offsetBeats + this.properties.endBeat <= context.fromBeats || offsetBeats + this.properties.startBeat >= context.toBeats) return;

		const envelope = this.properties.source as ReadonlyArray<Keyframe>;
		if (envelope.length === 0) return;

		const absoluteKeyframes: Array<Keyframe> = envelope.map((kf) => ({ ...kf, beat: offsetBeats + kf.beat }));

		const clipEndBeat = offsetBeats + (this.properties.endBeat - this.properties.startBeat);
		const evalBeat = Math.max(context.fromBeats, offsetBeats);
		const initialValue = evaluateAt(absoluteKeyframes, evalBeat);
		const beatToSec = (beat: number) => beatsToSeconds(beat, context.tempoMap);

		for (const path of this.properties.paths) {
			const driver = context.driverMap.get(path);
			if (!driver) continue;

			scheduleKeyframes(driver.offset, absoluteKeyframes, beatToSec, {
				fromBeat: context.fromBeats,
				toBeat: context.toBeats,
				initialValue,
			});

			if (clipEndBeat > context.toBeats) {
				const nextKf = firstAt(absoluteKeyframes, context.toBeats);
				if (nextKf && !nextKf.step) {
					const value = evaluateAt(absoluteKeyframes, context.toBeats);
					const toSeconds = beatToSec(context.toBeats);
					driver.offset.linearRampToValueAtTime(value, toSeconds);
				}
			}
		}
	}

	private scheduleLfo(offsetBeats: number, context: ScheduleContext): void {
		const lfo = this.properties.source as Lfo;

		if (offsetBeats >= context.toBeats) return;

		const lfoStartSeconds = beatsToSeconds(offsetBeats, context.tempoMap);
		const effectiveStartSeconds = lfoStartSeconds + lfo.delay;
		const windowStartSeconds = beatsToSeconds(context.fromBeats, context.tempoMap);
		const windowEndSeconds = beatsToSeconds(context.toBeats, context.tempoMap);

		if (windowEndSeconds <= effectiveStartSeconds) return;

		const freqHz = lfoFrequencyHz(lfo);
		if (freqHz <= 0) return;

		const elapsedSeconds = Math.max(0, windowStartSeconds - effectiveStartSeconds);
		const phase = (2 * Math.PI * freqHz * elapsedSeconds) % (2 * Math.PI);
		const phaseSeconds = phase / (2 * Math.PI) / freqHz;

		const oscStartSeconds = Math.max(effectiveStartSeconds, windowStartSeconds - phaseSeconds);

		for (const path of this.properties.paths) {
			const driver = context.driverMap.get(path);
			if (!driver) continue;

			const osc = context.audioContext.createOscillator();
			osc.type = lfo.shape;
			osc.frequency.value = freqHz;

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
		for (const path of this.properties.paths) {
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

	clone(overrides: Partial<PatternProperties>): AutomatePattern {
		return new AutomatePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}

	validate(context: ValidateContext): void {
		context.automationPaths.push({ name: this.properties.name, paths: [...this.properties.paths] });
	}
}

export function automate(name: string, paths: string | ReadonlyArray<string>, source: ReadonlyArray<Keyframe> | Lfo): AutomatePattern {
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
		const keyframes = source as ReadonlyArray<Keyframe>;

		if (keyframes.length === 0) {
			throw new ResequenceError("EMPTY_KEYFRAMES", "automate(): keyframes array must not be empty");
		}

		const endBeat = Math.max(...keyframes.map((kf) => kf.beat));

		return new AutomatePattern({ notes: [], children: [], startBeat: 0, endBeat, name, paths: resolvedPaths, source: keyframes });
	}

	return new AutomatePattern({ notes: [], children: [], startBeat: 0, endBeat: 0, name, paths: resolvedPaths, source: source as Lfo });
}

function firstAt(keyframes: ReadonlyArray<Keyframe>, beat: number): Keyframe | undefined {
	for (const kf of keyframes) {
		if (kf.beat >= beat) return kf;
	}
	return undefined;
}

function lfoFrequencyHz(lfo: Lfo): number {
	return lfo.frequency;
}
