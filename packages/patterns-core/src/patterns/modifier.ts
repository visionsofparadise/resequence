import type { MidiPatternProperties } from "./midi";
import { MidiPattern } from "./midi";
import type { Pattern, PatternProperties } from "./pattern";

export interface ModifierProperties extends MidiPatternProperties {
	readonly input: Pattern;
}

export type ModifierInput<P extends ModifierProperties> = Omit<P, keyof PatternProperties> & Pick<ModifierProperties, "input"> & Partial<PatternProperties>;

export abstract class ModifierPattern<P extends ModifierProperties = ModifierProperties> extends MidiPattern<P> {
	readonly type = ["pattern", "midi", "modifier"];

	constructor(properties: ModifierInput<P>) {
		super(ModifierPattern.resolveProperties<P>(properties));
	}

	private static resolveProperties<P extends ModifierProperties>(
		properties: ModifierInput<P>,
	): P {
		const cloned = properties.input.clone({});

		return {
			...properties,
			notes: properties.notes ?? cloned.notes,
			children: properties.children ?? cloned.children,
			startBeat: properties.startBeat ?? cloned.startBeat,
			endBeat: properties.endBeat ?? cloned.endBeat,
		} as P;
	}

	static override is(value: unknown): value is ModifierPattern {
		return MidiPattern.is(value) && value.type[2] === "modifier";
	}
}
