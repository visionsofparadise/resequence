import { NUM_OCTAVES, pitchKey } from "@resequence/patterns-core";
import type { Note, Pitch } from "@resequence/patterns-core";

export function repitchNote(note: Note, pitch: Pitch): Note {
	const shift = pitchKey(pitch) - pitchKey(note.pitch);

	return {
		...note,
		pitch,
		slides: note.slides?.map((slide) => ({
			...slide,
			value: slide.value + shift / (note.pitch.stepsPerOctave * NUM_OCTAVES),
		})),
	};
}
