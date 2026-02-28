import { ResequenceError } from "../error";

export interface Pitch {
	readonly class: number;
	readonly stepsPerOctave: number;
	readonly octave: number;
	readonly octaveRatio: number;
}

// FIX: We've spread tuning stuff randomly over three files
export interface TuningConfig {
	readonly classes: ReadonlyArray<string>;
	readonly octaveRatio?: number;
	readonly reference: { readonly class: string; readonly octave: number; readonly hz: number };
	readonly frequencies?: Readonly<Record<string, number>>;
}

const NOTE_NAMES: Record<string, number> = {
	C: 0,
	D: 2,
	E: 4,
	F: 5,
	G: 7,
	A: 9,
	B: 11,
};

const PITCH_REGEX = /^([A-G])(b|#)?(-1|[0-9])$/;

export function pitchKey(pitch: Pitch): number {
	return pitch.octave * pitch.stepsPerOctave + pitch.class;
}

export function addSteps(pitch: Pitch, steps: number): Pitch {
	const total = pitch.class + steps;
	const spo = pitch.stepsPerOctave;
	const newClass = ((total % spo) + spo) % spo;
	const octaveShift = Math.floor(total / spo);
	return { ...pitch, class: newClass, octave: pitch.octave + octaveShift };
}

// FIX: We need to phase out this utility, it's allowing sites to use the deprecated way of defining pitch through string or number. We should only be using Pitch objects. Use N.C4 instead
export function resolvePitch(input: string | number | Pitch): Pitch {
	if (typeof input === "object") return input;

	if (typeof input === "number") {
		const pitchClass = ((input % 12) + 12) % 12;
		const octave = Math.floor(input / 12) - 1;

		return { class: pitchClass, stepsPerOctave: 12, octave, octaveRatio: 2 };
	}

	const match = PITCH_REGEX.exec(input) as [string, string, string | undefined, string] | null;

	if (!match) throw new ResequenceError("INVALID_PITCH", `Invalid pitch: ${input}`);

	const [, noteName, accidental, octaveStr] = match;
	const semitone = NOTE_NAMES[noteName] ?? 0;
	const octave = parseInt(octaveStr, 10);
	const offset = accidental === "#" ? 1 : accidental === "b" ? -1 : 0;
	const pitchClass = (((semitone + offset) % 12) + 12) % 12;

	return { class: pitchClass, stepsPerOctave: 12, octave, octaveRatio: 2 };
}

export function pitchToMidi(pitch: Pitch): { note: number; bend: number } {
	const normalized = pitch.class / pitch.stepsPerOctave;
	const midiFloat = normalized * 12 + (pitch.octave + 1) * 12;
	const midiNote = Math.round(midiFloat);
	const bend = (midiFloat - midiNote) * 100;

	return { note: midiNote, bend };
}

export function pitchToCents(from: Pitch, to: Pitch, tuning?: TuningConfig): number {
	if (tuning?.frequencies) {
		const fromClass = tuning.classes[from.class];
		const toClass = tuning.classes[to.class];
		const fromBaseHz = fromClass !== undefined ? tuning.frequencies[fromClass] : undefined;
		const toBaseHz = toClass !== undefined ? tuning.frequencies[toClass] : undefined;

		if (fromBaseHz !== undefined && toBaseHz !== undefined) {
			const octaveRatio = tuning.octaveRatio ?? 2;
			const refOctave = tuning.reference.octave;
			const fromHz = fromBaseHz * Math.pow(octaveRatio, from.octave - refOctave);
			const toHz = toBaseHz * Math.pow(octaveRatio, to.octave - refOctave);

			return 1200 * Math.log2(toHz / fromHz);
		}
	}

	return (to.class / to.stepsPerOctave - from.class / from.stepsPerOctave) * 1200 * Math.log2(to.octaveRatio) + (to.octave - from.octave) * 1200;
}
