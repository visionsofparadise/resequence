import type { Keyframe } from "../automation/keyframe";
import { ResequenceError } from "../error";
import type { PatternProperties } from "./pattern";
import { Pattern } from "./pattern";

export interface TempoKeyframe {
	readonly beat: number;
	readonly bpm: number;
	readonly curve?: number;
	readonly step?: true;
}

export interface TempoOptions {
	readonly keyframes?: ReadonlyArray<TempoKeyframe>;
	readonly override?: boolean;
}

export interface TempoProperties extends PatternProperties {
	readonly bpm: number;
	readonly keyframes: ReadonlyArray<Keyframe>;
	readonly bpmMin: number;
	readonly bpmMax: number;
	readonly isOverride: boolean;
}

export class TempoPattern extends Pattern {
	readonly type = ["pattern", "tempo"] as const;

	static is(value: unknown): value is TempoPattern {
		return Pattern.is(value) && value.type[1] === "tempo";
	}

	constructor(readonly properties: TempoProperties) {
		super(properties);
	}

	clone(overrides: Partial<PatternProperties>): TempoPattern {
		return new TempoPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function tempo(pattern: Pattern, bpm: number, options?: TempoOptions): TempoPattern {
	if (bpm <= 0) {
		throw new ResequenceError("INVALID_TEMPO", `tempo(): bpm must be greater than 0, got ${bpm}`);
	}

	const inputKeyframes = options?.keyframes ?? [];

	for (const keyframe of inputKeyframes) {
		if (keyframe.beat < 0) {
			throw new ResequenceError("INVALID_TEMPO", `tempo(): keyframe beat must be >= 0, got ${keyframe.beat}`);
		}
		if (keyframe.bpm <= 0) {
			throw new ResequenceError("INVALID_TEMPO", `tempo(): keyframe bpm must be greater than 0, got ${keyframe.bpm}`);
		}
	}

	const allBpms = [bpm, ...inputKeyframes.map((kf) => kf.bpm)];
	const bpmMin = Math.min(...allBpms);
	const bpmMax = Math.max(...allBpms);
	const bpmRange = bpmMax - bpmMin;

	const keyframes: ReadonlyArray<Keyframe> = inputKeyframes.map((kf) => ({
		beat: kf.beat,
		value: bpmRange === 0 ? 0.5 : (kf.bpm - bpmMin) / bpmRange,
		curve: kf.curve,
		step: kf.step,
	}));

	return new TempoPattern({
		notes: [],
		children: [{ offsetBeats: 0, pattern }],
		startBeat: pattern.startBeat,
		endBeat: pattern.endBeat,
		bpm, keyframes, bpmMin, bpmMax, isOverride: options?.override ?? false,
	});
}
