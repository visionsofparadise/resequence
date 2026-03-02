import type { OptionalProperties } from "../utils/RequiredProperties";
import type { PatternProperties } from "./pattern";
import { ModifierPattern, type ModifierProperties } from "./modifiers/modifier";
import type { Pattern } from "./pattern";

export class SkipPattern extends ModifierPattern {
	readonly properties: ModifierProperties;

	constructor(properties: OptionalProperties<ModifierProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	setup(): Promise<void> {
		return Promise.resolve();
	}

	schedule(): void {
		return;
	}

	clone(overrides: Partial<PatternProperties>): SkipPattern {
		return new SkipPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function skip(pattern: Pattern): SkipPattern {
	return new SkipPattern({
		notes: [],
		children: [],
		startBeat: 0,
		endBeat: 0,
		input: pattern,
	});
}
