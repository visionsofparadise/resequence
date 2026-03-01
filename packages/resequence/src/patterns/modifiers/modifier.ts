import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { MidiPatternProperties } from "../midi";
import { MidiPattern } from "../midi";
import type { Pattern } from "../pattern";

export interface ModifierProperties extends MidiPatternProperties {
	readonly input: Pattern;
}

export abstract class ModifierPattern extends MidiPattern {
	readonly properties: ModifierProperties;

	constructor(properties: OptionalProperties<ModifierProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}
}
