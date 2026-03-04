import type { Keyframe } from "../automation/keyframe";
import { ResequenceError } from "../error";
import type { PatternProperties } from "./pattern";
import { Pattern } from "./pattern";

const BPM_RANGE = 1000;

export function normalizeBpm(bpm: number): number {
	return bpm / BPM_RANGE;
}

export function denormalizeBpm(value: number): number {
	return value * BPM_RANGE;
}

export interface TempoOptions {
	readonly keyframes?: ReadonlyArray<Keyframe>;
	readonly override?: boolean;
}

export interface TempoProperties extends PatternProperties {
	readonly bpm: number;
	readonly keyframes: ReadonlyArray<Keyframe>;
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

	const keyframes = options?.keyframes ?? [];

	for (const keyframe of keyframes) {
		if (keyframe.beat < 0) {
			throw new ResequenceError("INVALID_TEMPO", `tempo(): keyframe beat must be >= 0, got ${keyframe.beat}`);
		}
		if (keyframe.value < 0) {
			throw new ResequenceError("INVALID_TEMPO", `tempo(): keyframe value must be >= 0, got ${keyframe.value}`);
		}
	}

	return new TempoPattern({
		notes: [],
		children: [{ offsetBeats: 0, pattern }],
		startBeat: pattern.startBeat,
		endBeat: pattern.endBeat,
		bpm, keyframes, isOverride: options?.override ?? false,
	});
}
