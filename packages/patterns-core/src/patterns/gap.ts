import type { PatternProperties } from "./pattern";
import { Pattern } from "./pattern";

export interface GapProperties extends PatternProperties {
	readonly duration: number;
}

export class GapPattern extends Pattern<GapProperties> {
	readonly type = ["pattern"];
	readonly packageName = "@resequence/patterns-core";
	readonly unitName = "gap";

	clone(overrides: Partial<PatternProperties>): GapPattern {
		return new GapPattern({
			...this.properties,
			...overrides,
		});
	}
}

export function gap(duration: number): GapPattern {
	return new GapPattern({ notes: [], children: [], startBeat: 0, endBeat: duration, duration });
}
