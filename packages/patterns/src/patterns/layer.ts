import type { Note } from "../note";
import { MidiPattern } from "./midi";
import type { PatternProperties, RelativeChild, RelativeNote } from "./pattern";
import { Pattern } from "./pattern";

export class LayerPattern extends MidiPattern {
	readonly type = ["pattern", "midi", "layer"] as const;

	static override is(value: unknown): value is LayerPattern {
		return MidiPattern.is(value) && value.type[2] === "layer";
	}

	clone(overrides: Partial<PatternProperties>): LayerPattern {
		return new LayerPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function layer(...inputs: ReadonlyArray<Pattern | Note>): LayerPattern {
	const notes: Array<RelativeNote> = [];
	const children: Array<RelativeChild> = [];
	let startBeat = 0;
	let endBeat = 0;

	for (const input of inputs) {
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

	return new LayerPattern({ notes, children, startBeat, endBeat });
}
