import { N } from "@resequence/patterns-core";
import type { TuningNote } from "@resequence/patterns-core";

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

export function resolveTonalNote(tonalName: string, octave: number): TuningNote | undefined {
	const key = TONAL_TO_KEY[tonalName];

	if (!key) return undefined;

	return (N as unknown as Record<string, TuningNote>)[`${key}${octave}`];
}
