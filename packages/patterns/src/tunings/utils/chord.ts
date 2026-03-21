import { Chord } from "tonal";
import { note } from "../../note";
import type { LayerPattern } from "../../patterns/layer";
import { layer } from "../../patterns/layer";
import type { Pitch } from "../../pitch";
import { addSteps, pitchKey } from "../../pitch";
import type { TuningNote } from "../../tuning";
import { N } from "../chromatic";

const TONAL_TO_KEY: Record<string, string> = {
	C: "C",
	"C#": "Cs",
	Db: "Db",
	D: "D",
	"D#": "Ds",
	Eb: "Eb",
	E: "E",
	"E#": "Es",
	Fb: "Fb",
	F: "F",
	"F#": "Fs",
	Gb: "Gb",
	G: "G",
	"G#": "Gs",
	Ab: "Ab",
	A: "A",
	"A#": "As",
	Bb: "Bb",
	B: "B",
	"B#": "Bs",
	Cb: "Cb",
};

const CLASS_NAMES_TONAL = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

function resolveTonalNote(tonalName: string, octave: number): TuningNote | undefined {
	const key = TONAL_TO_KEY[tonalName];

	if (!key) return undefined;

	return (N as unknown as Record<string, TuningNote>)[`${key}${octave}`];
}

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
