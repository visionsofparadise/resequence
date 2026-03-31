import type { Note } from "../note";
import type { MidiPatternProperties } from "./midi";
import { MidiPattern } from "./midi";
import type { PatternProperties, RelativeChild, RelativeNote } from "./pattern";
import { Pattern } from "./pattern";

export interface LayerProperties extends MidiPatternProperties {
	readonly inputs?: ReadonlyArray<Pattern | Note>;
}

export class LayerPattern extends MidiPattern<LayerProperties> {
	readonly packageName = "@resequence/patterns-core";
	readonly unitName = "layer";

	constructor(properties: LayerProperties) {
		super(LayerPattern.resolveProperties(properties));
	}

	private static resolveProperties(properties: LayerProperties): LayerProperties {
		if (!properties.inputs) return properties;

		const notes: Array<RelativeNote> = [];
		const children: Array<RelativeChild> = [];
		let startBeat = 0;
		let endBeat = 0;

		for (const input of properties.inputs) {
			if (!(input instanceof Pattern)) {
				notes.push({ offsetBeats: 0, note: input });
				startBeat = Math.min(startBeat, input.startBeat);
				endBeat = Math.max(endBeat, input.endBeat);
			} else {
				children.push({ offsetBeats: 0, pattern: input });
				startBeat = Math.min(startBeat, input.startBeat);
				endBeat = Math.max(endBeat, input.endBeat);
			}
		}

		return { ...properties, notes, children, startBeat, endBeat };
	}

	clone(overrides: Partial<PatternProperties>): LayerPattern {
		return new LayerPattern({
			...this.properties,
			...overrides,
		});
	}
}

export function layer(...inputs: ReadonlyArray<Pattern | Note>): LayerPattern {
	return new LayerPattern({ notes: [], children: [], startBeat: 0, endBeat: 0, inputs });
}
