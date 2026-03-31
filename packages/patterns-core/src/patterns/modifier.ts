import type { MidiPatternProperties } from "./midi";
import { MidiPattern } from "./midi";
import type { Pattern } from "./pattern";

export interface ModifierProperties extends MidiPatternProperties {
	readonly input: Pattern;
}

export abstract class ModifierPattern<P extends ModifierProperties = ModifierProperties> extends MidiPattern<P> {
	readonly type = ["pattern", "midi", "modifier"];

	static override is(value: unknown): value is ModifierPattern {
		return MidiPattern.is(value) && value.type[2] === "modifier";
	}
}
