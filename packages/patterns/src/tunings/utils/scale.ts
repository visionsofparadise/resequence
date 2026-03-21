import { Scale } from "tonal";
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

export type ScaleAccessor = (degree: number, octave?: number) => TuningNote;

const SCALE_REGEX = /^([A-G][#b]?)(\d)\s+(.+)/;

function resolveTonalNote(tonalName: string, octave: number): TuningNote | undefined {
	const key = TONAL_TO_KEY[tonalName];

	if (!key) return undefined;

	return (N as unknown as Record<string, TuningNote>)[`${key}${octave}`];
}

export function CS(name: string): ScaleAccessor {
	const match = SCALE_REGEX.exec(name) as [string, string, string, string] | null;

	if (!match) throw new Error(`Invalid scale name: ${name}`);

	const [, root, octaveStr, scaleType] = match;
	const rootOctave = parseInt(octaveStr, 10);

	const scaleData = Scale.get(`${root} ${scaleType}`);

	if (scaleData.empty) throw new Error(`Unknown scale: ${name}`);

	const pitchClasses = scaleData.notes;

	return (degree: number, octave?: number): TuningNote => {
		const len = pitchClasses.length;
		const zeroBased = degree > 0 ? degree - 1 : degree;
		const index = ((zeroBased % len) + len) % len;
		const octaveOffset = Math.floor(zeroBased / len);

		const pitchClass = pitchClasses[index] ?? "C";
		const resolvedOctave = octave ?? rootOctave + octaveOffset;

		const resolved = resolveTonalNote(pitchClass, resolvedOctave);

		if (!resolved) throw new Error(`Cannot resolve scale note: ${pitchClass}${resolvedOctave}`);

		return resolved;
	};
}
