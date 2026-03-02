import type { OptionalProperties } from "../utils/RequiredProperties";
import type { PatternProperties } from "./pattern";
import { ModifierPattern, type ModifierProperties } from "./modifiers/modifier";
import type { Pattern } from "./pattern";

export class MutePattern extends ModifierPattern {
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

	clone(overrides: Partial<PatternProperties>): MutePattern {
		return new MutePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function mute(pattern: Pattern): MutePattern {
	return new MutePattern({
		notes: [],
		children: [],
		startBeat: pattern.startBeat,
		endBeat: pattern.endBeat,
		input: pattern,
	});
}
