import { Chord, Scale } from "tonal";
import { note } from "../note";
import type { LayerPattern } from "../patterns/layer";
import { layer } from "../patterns/layer";
import type { Pitch } from "../pitch";
import { addSteps, pitchKey } from "../pitch";
import type { ResolvedTuning, Tuning, TuningNote } from "../tuning";
import { addAliases, createTuning } from "../tuning";

const CHROMATIC_CLASSES = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"] as const;

type ChromaticClass = (typeof CHROMATIC_CLASSES)[number];

const baseTuning = createTuning({
	classes: CHROMATIC_CLASSES,
	octaveRatio: 2,
	reference: { class: "A", octave: 4, hz: 440 },
});

export const CHROMATIC_TUNING: ResolvedTuning = baseTuning.config;

type ChromaticAlias = "Db" | "Eb" | "Fb" | "Gb" | "Ab" | "Bb" | "Cb" | "Bs" | "Es";

// eslint-disable-next-line @typescript-eslint/naming-convention
export const N: Tuning<ChromaticClass | ChromaticAlias> = addAliases(baseTuning, {
	Db: "Cs",
	Eb: "Ds",
	Fb: "E",
	Gb: "Fs",
	Ab: "Gs",
	Bb: "As",
	Es: "F",
	Cb: ["B", -1],
	Bs: ["C", 1],
});

// --- Tonal.js note name mapping ---

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

function chromaticChord(root: Pitch, quality: string, duration: number): LayerPattern {
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

// --- Scale ---

export type ScaleAccessor = (degree: number, octave?: number) => TuningNote;

const SCALE_REGEX = /^([A-G][#b]?)(\d)\s+(.+)/;

function chromaticScale(name: string): ScaleAccessor {
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

// --- ChromaticNamespace ---

export type ChromaticNamespace = Tuning<ChromaticClass | ChromaticAlias> & {
	chord(root: Pitch, quality: string, duration: number): LayerPattern;
	scale(name: string): ScaleAccessor;
};

export const Chromatic: ChromaticNamespace = Object.assign({}, N, {
	chord: chromaticChord,
	scale: chromaticScale,
}) as unknown as ChromaticNamespace;
