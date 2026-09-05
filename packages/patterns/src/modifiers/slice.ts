import { ModifierPattern, toPattern, flatModifyNotes } from "@resequence/patterns-core";
import { noteSpanEntriesOf } from "../utils/noteSpanEntries";
import type { Event, Note, ModifierProperties, Pattern, PatternProperties } from "@resequence/patterns-core";

export interface SliceProperties extends ModifierProperties {
	readonly from: number;
	readonly to: number;
}

export class SlicePattern extends ModifierPattern<SliceProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "slice";

	override _setup(): Array<Event> {
		const entries = noteSpanEntriesOf(this);

		const keptEntries = entries.slice(this.properties.from, this.properties.to);

		const first = keptEntries[0];
		const last = keptEntries[keptEntries.length - 1];

		if (!first || !last) {
			this.properties.notes = [];
			this.properties.children = [];
			this.properties.startBeat = 0;
			this.properties.endBeat = 0;

			return [];
		}

		const kept = new Set(keptEntries.map((entry) => entry.note));
		const firstStart = first.absoluteStart;
		const durationBeats = last.absoluteEnd - firstStart;

		flatModifyNotes(this, (note) => {
			if (!kept.has(note)) return [];

			return [{ ...note, startBeat: note.startBeat - firstStart, endBeat: note.endBeat - firstStart }];
		});

		this.properties.startBeat = 0;
		this.properties.endBeat = durationBeats;

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): SlicePattern {
		return new SlicePattern({ from: this.properties.from, to: this.properties.to, input: this.properties.input });
	}
}

export function slice(pattern: Pattern | Note, from: number, to: number): SlicePattern {
	const resolved = toPattern(pattern);

	return new SlicePattern({ from, to, input: resolved });
}
