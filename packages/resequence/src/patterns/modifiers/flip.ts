import type { Pitch } from "../../utils/pitch";
import { addSteps, NUM_OCTAVES, pitchKey } from "../../utils/pitch";
import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { mapNotes } from "../utils/tree";

export class FlipPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly center: Pitch,
		readonly range: [Pitch, Pitch] | undefined,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): FlipPattern {
		return new FlipPattern(this.source, this.center, this.range, this.overrideNode(overrides));
	}
}

export function flip(pattern: Pattern | ScoreNote, center: Pitch, range?: [Pitch, Pitch]): FlipPattern {
	const resolved = toPattern(pattern);
	const centerPitch = center;
	const resolvedRange = range;
	const centerKey = pitchKey(centerPitch);

	const transformed = mapNotes(resolved, (note) => {
		const spo = note.pitch.stepsPerOctave;
		const newKey = centerKey * 2 - pitchKey(note.pitch);
		const newOctave = Math.floor(newKey / spo);
		const newClass = ((newKey % spo) + spo) % spo;
		let pitch: Pitch = { class: newClass, stepsPerOctave: note.pitch.stepsPerOctave, octave: newOctave, octaveRatio: note.pitch.octaveRatio };

		if (resolvedRange) {
			const rangeMinKey = pitchKey(resolvedRange[0]);
			const rangeMaxKey = pitchKey(resolvedRange[1]);
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

	return new FlipPattern(pattern, centerPitch, resolvedRange, transformed);
}
