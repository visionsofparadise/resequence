import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { Pitch } from "../../utils/pitch";
import { evaluateSlide } from "../../utils/slide";
import type { ScoreNoteSlide } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { flatMapNotes } from "../utils/tree";

export class ChopPattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
		readonly subdivision: number,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): ChopPattern {
		return new ChopPattern(this.source, this.subdivision, this.overrideNode(overrides));
	}
}

export function chop(pattern: Pattern, subdivision: Duration | number): ChopPattern {
	const resolvedSubdivision = resolveDuration(subdivision);

	const transformed = flatMapNotes(pattern, (note) => {
		const duration = note.endBeat - note.startBeat;
		const chopCount = Math.floor(duration / resolvedSubdivision);
		const result = [];

		for (let chopIndex = 0; chopIndex < chopCount; chopIndex++) {
			const chopStart = chopIndex * resolvedSubdivision;
			const chopEnd = chopStart + resolvedSubdivision;

			let pitch: Pitch = note.pitch;
			let slides: ReadonlyArray<ScoreNoteSlide> | undefined;

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

	return new ChopPattern(pattern, resolvedSubdivision, transformed);
}
