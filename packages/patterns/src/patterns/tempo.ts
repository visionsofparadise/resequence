import type { Keyframe } from "../events";
import { PatternsError } from "../error";
import type { PatternProperties } from "./pattern";
import { Pattern } from "./pattern";

export interface TempoOptions {
	readonly keyframes?: ReadonlyArray<Keyframe>;
	readonly override?: boolean;
}

export interface TempoProperties extends PatternProperties {
	readonly bpm: number;
	readonly keyframes: ReadonlyArray<Keyframe>;
	readonly isOverride: boolean;
}

export class TempoPattern extends Pattern<TempoProperties> {
	static is(value: unknown): value is TempoPattern {
		return value instanceof TempoPattern;
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
		throw new PatternsError("INVALID_TEMPO", `tempo(): bpm must be greater than 0, got ${bpm}`);
	}

	const keyframes = options?.keyframes ?? [];

	for (const keyframe of keyframes) {
		if (keyframe.beat < 0) {
			throw new PatternsError("INVALID_TEMPO", `tempo(): keyframe beat must be >= 0, got ${keyframe.beat}`);
		}
		if (keyframe.value < 0) {
			throw new PatternsError("INVALID_TEMPO", `tempo(): keyframe value must be >= 0, got ${keyframe.value}`);
		}
	}

	return new TempoPattern({
		notes: [],
		children: [{ offsetBeats: 0, pattern }],
		startBeat: pattern.startBeat,
		endBeat: pattern.endBeat,
		bpm,
		keyframes,
		isOverride: options?.override ?? false,
	});
}
