import type { PatternProperties } from "./pattern";
import { Pattern } from "./pattern";

export interface GapProperties extends PatternProperties {
	readonly duration: number;
}

export class GapPattern extends Pattern<GapProperties> {
	static is(value: unknown): value is GapPattern {
		return value instanceof GapPattern;
	}

	clone(overrides: Partial<PatternProperties>): GapPattern {
		return new GapPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function gap(duration: number): GapPattern {
	return new GapPattern({ notes: [], children: [], startBeat: 0, endBeat: duration, duration });
}
