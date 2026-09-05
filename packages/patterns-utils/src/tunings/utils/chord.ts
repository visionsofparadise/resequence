import { addSteps, layer, note, pitchKey } from "@resequence/patterns-core";
import { Chord } from "tonal";
import { resolveTonalNote } from "./resolveTonalNote";
import type { LayerPattern, Pitch } from "@resequence/patterns-core";

const CLASS_NAMES_TONAL = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function CD(root: Pitch, quality: string, duration: number): LayerPattern {
	const rootName = CLASS_NAMES_TONAL[root.class] ?? "C";
	const chordData = Chord.get(`${rootName}${quality}`);

	if (chordData.empty) throw new Error(`Unknown chord quality: ${quality}`);

	const notes = chordData.notes.map((pitchClass) => {
		const resolved = resolveTonalNote(pitchClass, root.octave);

		if (!resolved) throw new Error(`Cannot resolve tonal note: ${pitchClass}${root.octave}`);

		const adjusted = pitchKey(resolved) < pitchKey(root) ? addSteps(resolved, resolved.stepsPerOctave) : resolved;

		return note(adjusted, duration);
	});

	return layer(...notes);
}
