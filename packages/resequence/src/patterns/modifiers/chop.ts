import type { Keyframe } from "../../automation/keyframe";
import type { Pitch } from "../../utils/pitch";
import { evaluateSlide } from "../../utils/slide";
import type { ScoreNote } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { toPattern } from "../sequence";
import { flatMapNotes } from "../utils/tree";

export class ChopPattern extends MidiPattern {
	constructor(
		readonly source: Pattern | ScoreNote,
		readonly subdivision: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): ChopPattern {
		return new ChopPattern(this.source, this.subdivision, this.overrideNode(overrides));
	}
}

export function chop(pattern: Pattern | ScoreNote, subdivision: number): ChopPattern {
	const resolved = toPattern(pattern);
	const transformed = flatMapNotes(resolved, (note) => {
		const duration = note.endBeat - note.startBeat;
		const chopCount = Math.floor(duration / subdivision);
		const result = [];

		for (let chopIndex = 0; chopIndex < chopCount; chopIndex++) {
			const chopStart = chopIndex * subdivision;
			const chopEnd = chopStart + subdivision;

			let pitch: Pitch = note.pitch;
			let slides: ReadonlyArray<Keyframe> | undefined;

			if (note.slides && note.slides.length > 0) {
				pitch = evaluateSlide(note.pitch, note.slides, chopStart);
				const segmentSlides = note.slides
					.filter((sl) => sl.beat > chopStart && sl.beat <= chopEnd)
					.map((sl) => ({ ...sl, beat: sl.beat - chopStart }));
				slides = segmentSlides.length > 0 ? segmentSlides : undefined;
			}

			result.push({
				...note,
				startBeat: note.startBeat + chopStart,
				endBeat: note.startBeat + chopEnd,
				pitch,
				slides,
			});
		}

		return result;
	});

	return new ChopPattern(pattern, subdivision, transformed);
}
