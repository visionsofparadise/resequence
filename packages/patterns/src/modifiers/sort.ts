import type { Note, ModifierProperties, Pattern, PatternProperties, Pitch } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, NUM_OCTAVES, pitchKey, modifyNotes, walkNotes } from "@resequence/patterns-core";
export type SortKey = "asc" | "desc" | ((noteA: Note, noteB: Note) => number);

export interface SortProperties extends ModifierProperties {
	readonly key: SortKey;
}

export class SortPattern extends ModifierPattern<SortProperties> {
	readonly type = ["pattern", "midi", "modifier", "sort"] as const;

	static override is(value: unknown): value is SortPattern {
		return ModifierPattern.is(value) && value.type[3] === "sort";
	}

	clone(overrides: Partial<PatternProperties>): SortPattern {
		return new SortPattern({
			...this.properties,
			...overrides,
		});
	}
}

export function sort(pattern: Pattern | Note, key: SortKey = "asc"): SortPattern {
	const resolved = toPattern(pattern);
	const entries: Array<{ id: string; absoluteStart: number; pitch: Pitch; absoluteNote: Note }> = [];

	walkNotes(resolved, (note, { id, absoluteOffset }) => {
		entries.push({
			id,
			absoluteStart: absoluteOffset + note.startBeat,
			pitch: note.pitch,
			absoluteNote: { ...note, startBeat: absoluteOffset + note.startBeat, endBeat: absoluteOffset + note.endBeat },
		});
	});
	const byTick = entries.slice().sort((ea, eb) => ea.absoluteStart - eb.absoluteStart);

	let pitches: Array<Pitch>;

	if (typeof key === "function") {
		pitches = entries
			.slice()
			.sort((ea, eb) => key(ea.absoluteNote, eb.absoluteNote))
			.map((entry) => entry.pitch);
	} else if (key === "desc") {
		pitches = byTick.map((entry) => entry.pitch).sort((pitchA, pitchB) => pitchKey(pitchB) - pitchKey(pitchA));
	} else {
		pitches = byTick.map((entry) => entry.pitch).sort((pitchA, pitchB) => pitchKey(pitchA) - pitchKey(pitchB));
	}

	const pitchAssignment = new Map<string, Pitch>();

	for (const [noteIndex, entry] of byTick.entries()) {
		const newPitch = pitches[noteIndex] ?? entry.pitch;

		if (pitchKey(newPitch) !== pitchKey(entry.pitch)) {
			pitchAssignment.set(entry.id, newPitch);
		}
	}

	const cloned = resolved.clone({});

	modifyNotes(cloned, (note, { id }) => {
		const newPitch = pitchAssignment.get(id);

		if (newPitch) {
			const shift = pitchKey(newPitch) - pitchKey(note.pitch);

			return {
				...note,
				pitch: newPitch,
				slides: note.slides?.map((sl) => ({ ...sl, value: sl.value + shift / (note.pitch.stepsPerOctave * NUM_OCTAVES) })),
			};
		}

		return note;
	});

	return new SortPattern({
		notes: cloned.notes,
		children: cloned.children,
		startBeat: cloned.startBeat,
		endBeat: cloned.endBeat,
		key,
		input: resolved,
	});
}
