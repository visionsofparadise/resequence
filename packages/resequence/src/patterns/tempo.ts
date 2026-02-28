import { ResequenceError } from "../error";
import type { PatternNode } from "./pattern";
import { Pattern } from "./pattern";

export interface TempoKeyframe {
	readonly beat: number;
	readonly bpm: number;
	readonly curve?: "step" | "linear" | "exponential";
}

export interface TempoOptions {
	readonly keyframes?: ReadonlyArray<TempoKeyframe>;
	readonly override?: boolean;
}

export class TempoPattern extends Pattern {
	constructor(
		readonly bpm: number,
		readonly keyframes: ReadonlyArray<TempoKeyframe>,
		readonly isOverride: boolean,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): TempoPattern {
		return new TempoPattern(this.bpm, this.keyframes, this.isOverride, this.overrideNode(overrides));
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
		if (keyframe.bpm <= 0) {
			throw new ResequenceError("INVALID_TEMPO", `tempo(): keyframe bpm must be greater than 0, got ${keyframe.bpm}`);
		}
	}

	return new TempoPattern(bpm, keyframes, options?.override ?? false, { notes: [], children: [{ offsetBeats: 0, pattern }], startBeat: pattern.startBeat, endBeat: pattern.endBeat });
}
