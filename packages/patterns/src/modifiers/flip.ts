import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import type { Pitch } from "../pitch";
import { addSteps, NUM_OCTAVES, pitchKey } from "../pitch";
import { modifyNotes } from "../utils/modify";

export interface FlipProperties extends ModifierProperties {
	readonly center: Pitch;
	readonly range: [Pitch, Pitch] | undefined;
}

export class FlipPattern extends ModifierPattern<FlipProperties> {
	readonly type = ["pattern", "midi", "modifier", "flip"] as const;

	static override is(value: unknown): value is FlipPattern {
		return ModifierPattern.is(value) && value.type[3] === "flip";
	}

	clone(overrides: Partial<PatternProperties>): FlipPattern {
		return new FlipPattern({
			...this.properties,
			...overrides,
		});
	}
}

export function flip(pattern: Pattern | Note, center: Pitch, range?: [Pitch, Pitch]): FlipPattern {
	const resolved = toPattern(pattern);
	const centerKey = pitchKey(center);

	const cloned = resolved.clone({});

	modifyNotes(cloned, (note) => {
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
		notes: cloned.notes,
		children: cloned.children,
		startBeat: cloned.startBeat,
		endBeat: cloned.endBeat,
		center,
		range,
		input: resolved,
	});
}
