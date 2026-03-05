export interface Pitch {
	readonly class: number;
	readonly stepsPerOctave: number;
	readonly octave: number;
	readonly octaveRatio: number;
}

export function pitchToMidi(pitch: Pitch): { note: number; bend: number } {
	const normalized = pitch.class / pitch.stepsPerOctave;
	const midiFloat = normalized * 12 + (pitch.octave + 1) * 12;
	const midiNote = Math.round(midiFloat);
	const bend = (midiFloat - midiNote) * 100;

	return { note: midiNote, bend };
}
