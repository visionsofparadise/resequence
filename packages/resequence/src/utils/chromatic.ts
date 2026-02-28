import { Chord } from "tonal";
import { ResequenceError } from "../error";
import type { LayerPattern } from "../patterns/layer";
import { layer } from "../patterns/layer";
import { note } from "../patterns/note";
import type { Duration } from "./duration";
import { resolveDuration } from "./duration";
import type { Pitch, TuningConfig } from "./pitch";
import { addSteps, pitchKey, resolvePitch } from "./pitch";
import type { ScaleAccessor } from "./scale";
import { scale as scaleUtil } from "./scale";
import type { TuningEntry } from "./tuning";
import { createTuning } from "./tuning";

const CHROMATIC_CLASSES = ["C", "Cs", "D", "Ds", "E", "F", "Fs", "G", "Gs", "A", "As", "B"];

export const CHROMATIC_TUNING: TuningConfig = {
	classes: CHROMATIC_CLASSES,
	octaveRatio: 2,
	reference: { class: "A", octave: 4, hz: 440 },
	frequencies: {
		C: 261.6255653005986,
		Cs: 277.1826309768721,
		D: 293.6647679174076,
		Ds: 311.1269837220809,
		E: 329.6275569128699,
		F: 349.2282314330039,
		Fs: 369.9944227116344,
		G: 391.99543598374953,
		Gs: 415.3046975799451,
		A: 440,
		As: 466.1637615180899,
		B: 493.8833012561241,
	},
};

// Standard sharp names for Tonal.js lookups (uses # not s)
const CLASS_NAMES_TONAL = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Flat aliases: [aliasName, primaryClass, octaveOffset]
const FLAT_ALIASES: ReadonlyArray<[string, string, number]> = [
	["Db", "Cs", 0],
	["Eb", "Ds", 0],
	["Fb", "E",  0],
	["Gb", "Fs", 0],
	["Ab", "Gs", 0],
	["Bb", "As", 0],
	["Cb", "B",  -1],  // Cb4 = B3
	["Bs", "C",   1],  // Bs4 = C5
	["Es", "F",   0],  // Es4 = F4
];

const nBase = createTuning(CHROMATIC_TUNING);

// Add flat aliases to namespace
for (const [alias, target, octaveOffset] of FLAT_ALIASES) {
	for (let octave = 0; octave <= 9; octave++) {
		const targetOctave = octave + octaveOffset;

		if (targetOctave < 0 || targetOctave > 9) continue;

		const entry = nBase[`${target}${targetOctave}`];

		if (entry) nBase[`${alias}${octave}`] = entry;
	}
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export const N: Record<string, TuningEntry> = nBase;

function chromaticChord(root: Pitch, quality: string, duration: Duration): LayerPattern {
	const rootName = CLASS_NAMES_TONAL[root.class] ?? "C";
	const chordData = Chord.get(`${rootName}${quality}`);

	if (chordData.empty) throw new ResequenceError("UNKNOWN_CHORD_QUALITY", `Unknown chord quality: ${quality}`);

	const durationBeats = resolveDuration(duration);

	const notes = chordData.notes.map((pitchClass) => {
		const notePitch = resolvePitch(`${pitchClass}${root.octave}`);
		const adjusted = pitchKey(notePitch) < pitchKey(root) ? addSteps(notePitch, notePitch.stepsPerOctave) : notePitch;

		return note(adjusted, durationBeats);
	});

	return layer(...notes);
}

export type ChromaticNamespace = Record<string, TuningEntry> & {
	chord(root: Pitch, quality: string, duration: Duration): LayerPattern;
	scale(name: string): ScaleAccessor;
};

export const Chromatic = {
	...nBase,
	chord: chromaticChord,
	scale: scaleUtil,
} as unknown as ChromaticNamespace;
