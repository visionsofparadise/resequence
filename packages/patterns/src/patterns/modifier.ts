import type { MidiPatternProperties } from "./midi";
import { MidiPattern } from "./midi";
import type { Pattern } from "./pattern";

export interface ModifierProperties extends MidiPatternProperties {
	readonly input: Pattern;
}

export abstract class ModifierPattern<P extends ModifierProperties = ModifierProperties> extends MidiPattern<P> {
	static is(value: unknown): value is ModifierPattern {
		return value instanceof ModifierPattern;
	}
}
