import type { Note } from "../note";
import type { Pitch } from "../pitch";
import { addSteps, NUM_OCTAVES, pitchKey } from "../pitch";
import type { PatternProperties } from "../patterns/pattern";
import type { Pattern } from "../patterns/pattern";
import type { ModifierProperties } from "../patterns/modifier-pattern";
import { ModifierPattern } from "../patterns/modifier-pattern";
import { toPattern } from "../patterns/sequence";
import { mapNotes } from "../utils/map";

export interface FlipProperties extends ModifierProperties {
	readonly center: Pitch;
	readonly range: [Pitch, Pitch] | undefined;
}

export class FlipPattern extends ModifierPattern<FlipProperties> {
	static is(value: unknown): value is FlipPattern {
		return value instanceof FlipPattern;
	}

	clone(overrides: Partial<PatternProperties>): FlipPattern {
		return new FlipPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function flip(pattern: Pattern | Note, center: Pitch, range?: [Pitch, Pitch]): FlipPattern {
	const resolved = toPattern(pattern);
	const centerKey = pitchKey(center);

	const transformed = mapNotes(resolved, (note) => {
		const spo = note.pitch.stepsPerOctave;
		const newKey = centerKey * 2 - pitchKey(note.pitch);
		const newOctave = Math.floor(newKey / spo);
		const newClass = ((newKey % spo) + spo) % spo;
		let pitch: Pitch = { class: newClass, stepsPerOctave: spo, octave: newOctave, octaveRatio: note.pitch.octaveRatio };

		if (range) {
			const rangeMinKey = pitchKey(range[0]);
			const rangeMaxKey = pitchKey(range[1]);
			while (pitchKey(pitch) < rangeMinKey) pitch = addSteps(pitch, spo);
			while (pitchKey(pitch) > rangeMaxKey) pitch = addSteps(pitch, -spo);
		}

		const shift = pitchKey(pitch) - pitchKey(note.pitch);
		return {
			...note,
			pitch,
			slides: note.slides?.map((sl) => ({ ...sl, value: sl.value + shift / (note.pitch.stepsPerOctave * NUM_OCTAVES) })),
		};
	});

	return new FlipPattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		center,
		range,
		input: resolved,
	});
}
