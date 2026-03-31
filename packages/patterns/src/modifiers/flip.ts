import type { Note, ModifierProperties, Pattern, PatternProperties, Pitch } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, addSteps, NUM_OCTAVES, pitchKey, modifyNotes } from "@resequence/patterns-core";
export interface FlipProperties extends ModifierProperties {
	readonly center: Pitch;
	readonly range: [Pitch, Pitch] | undefined;
}

export class FlipPattern extends ModifierPattern<FlipProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "flip";

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
