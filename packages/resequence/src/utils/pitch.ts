import type { ResolvedTuning } from "./tuning";

export interface Pitch {
	readonly class: number;
	readonly stepsPerOctave: number;
	readonly octave: number;
	readonly octaveRatio: number;
}

export function pitchKey(pitch: Pitch): number {
	return pitch.octave * pitch.stepsPerOctave + pitch.class;
}

export function addSteps(pitch: Pitch, steps: number): Pitch {
	const total = pitch.class + steps;
	const spo = pitch.stepsPerOctave;
	const newClass = ((total % spo) + spo) % spo;
	const octaveShift = Math.floor(total / spo);
	return { class: newClass, stepsPerOctave: pitch.stepsPerOctave, octave: pitch.octave + octaveShift, octaveRatio: pitch.octaveRatio };
}

export function pitchToMidi(pitch: Pitch): { note: number; bend: number } {
	const normalized = pitch.class / pitch.stepsPerOctave;
	const midiFloat = normalized * 12 + (pitch.octave + 1) * 12;
	const midiNote = Math.round(midiFloat);
	const bend = (midiFloat - midiNote) * 100;

	return { note: midiNote, bend };
}

export function pitchToCents(from: Pitch, to: Pitch, tuning?: ResolvedTuning): number {
	if (tuning) {
		const fromClass = tuning.classes[from.class];
		const toClass = tuning.classes[to.class];
		const fromBaseHz = fromClass !== undefined ? tuning.frequencies[fromClass] : undefined;
		const toBaseHz = toClass !== undefined ? tuning.frequencies[toClass] : undefined;

		if (fromBaseHz !== undefined && toBaseHz !== undefined) {
			const fromHz = fromBaseHz * Math.pow(tuning.octaveRatio, from.octave - tuning.referenceOctave);
			const toHz = toBaseHz * Math.pow(tuning.octaveRatio, to.octave - tuning.referenceOctave);

			return 1200 * Math.log2(toHz / fromHz);
		}
	}

	return (to.class / to.stepsPerOctave - from.class / from.stepsPerOctave) * 1200 * Math.log2(to.octaveRatio) + (to.octave - from.octave) * 1200;
}

export const NUM_OCTAVES = 11;

export function normalizePitch(pitch: Pitch): number {
	return pitchKey(pitch) / (pitch.stepsPerOctave * NUM_OCTAVES);
}

export function denormalizePitch(value: number, stepsPerOctave: number, octaveRatio: number): Pitch {
	const totalSteps = Math.round(value * stepsPerOctave * NUM_OCTAVES);
	const pitchClass = ((totalSteps % stepsPerOctave) + stepsPerOctave) % stepsPerOctave;
	const octave = Math.floor(totalSteps / stepsPerOctave);
	return { class: pitchClass, stepsPerOctave, octave, octaveRatio };
}
