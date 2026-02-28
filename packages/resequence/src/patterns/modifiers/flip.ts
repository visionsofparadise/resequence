import type { Pitch } from "../../utils/pitch";
import { addSteps, pitchKey, resolvePitch } from "../../utils/pitch";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { mapNotes } from "../utils/tree";

export class FlipPattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
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

export function flip(pattern: Pattern, center: string | number | Pitch, range?: [string | number | Pitch, string | number | Pitch]): FlipPattern {
	const centerPitch = resolvePitch(center);
	const resolvedRange: [Pitch, Pitch] | undefined = range ? [resolvePitch(range[0]), resolvePitch(range[1])] : undefined;
	const centerKey = pitchKey(centerPitch);

	const transformed = mapNotes(pattern, (note) => {
		const spo = note.pitch.stepsPerOctave;
		const newKey = centerKey * 2 - pitchKey(note.pitch);
		const newOctave = Math.floor(newKey / spo);
		const newClass = ((newKey % spo) + spo) % spo;
		let pitch: Pitch = { ...note.pitch, class: newClass, octave: newOctave };

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
			slides: note.slides?.map((sl) => ({ ...sl, pitch: addSteps(sl.pitch, shift) })),
		};
	});

	return new FlipPattern(pattern, centerPitch, resolvedRange, transformed);
}
