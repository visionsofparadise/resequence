import type { Pitch } from "./pitch";
import type { ResolvedTuning } from "./tuning";

export function pitchToFrequency(pitch: Pitch, tuning: ResolvedTuning): number {
	const className = tuning.classes[pitch.class];
	const baseHz = className !== undefined ? tuning.frequencies[className] : undefined;

	if (baseHz !== undefined) {
		return baseHz * Math.pow(tuning.octaveRatio, pitch.octave - tuning.referenceOctave);
	}

	const rootName = tuning.classes[0];
	const rootHz = rootName !== undefined ? (tuning.frequencies[rootName] ?? 0) : 0;
	const fraction = pitch.class / pitch.stepsPerOctave;
	return rootHz * Math.pow(tuning.octaveRatio, fraction + (pitch.octave - tuning.referenceOctave));
}

export function frequencyToNoteAndBend(frequency: number): { note: number; bend: number } {
	const midiFloat = 69 + 12 * Math.log2(frequency / 440);
	const note = Math.round(midiFloat);
	const bend = (midiFloat - note) * 100;

	return { note, bend };
}
