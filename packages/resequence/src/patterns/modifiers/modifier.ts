import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { MidiPatternProperties } from "../midi";
import { MidiPattern } from "../midi";
import type { Pattern } from "../pattern";

export interface ModifierProperties extends MidiPatternProperties {
	readonly input: Pattern;
}

export abstract class ModifierPattern extends MidiPattern {
	abstract readonly type: readonly ["pattern", "midi", "modifier", ...Array<string>];
	readonly properties: ModifierProperties;

	static is(value: unknown): value is ModifierPattern {
		return MidiPattern.is(value) && value.type[2] === "modifier";
	}

	constructor(properties: OptionalProperties<ModifierProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}
}
