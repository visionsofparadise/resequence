import { pitchKey } from "../../utils/pitch";
import { evaluateSlide, mergeSlides } from "../../utils/slide";
import type { ScoreNote, ScoreNoteSlide } from "../note";
import type { PatternNode } from "../pattern";
import { MidiPattern, type Pattern } from "../pattern";
import { collectNotes, mapNotes } from "../utils/tree";

export class SlidePattern extends MidiPattern {
	constructor(
		readonly source: Pattern,
		node: PatternNode,
	) {
		super(node);
	}

	clone(overrides: Partial<PatternNode>): SlidePattern {
		return new SlidePattern(this.source, this.overrideNode(overrides));
	}
}

export function slide(pattern: Pattern): SlidePattern {
	const allNotes = collectNotes(pattern);

	if (allNotes.length < 2) {
		return new SlidePattern(pattern, pattern);
	}

	const sorted = allNotes.slice().sort((noteA, noteB) => noteA.startBeat - noteB.startBeat);

	const slideMap = new Map<string, Array<ScoreNoteSlide>>();

	for (const noteA of sorted) {
		const aEnd = noteA.endBeat;
		let bestMatch: ScoreNote | undefined;
		let bestDistance = Infinity;

		for (const noteB of sorted) {
			if (noteB.startBeat <= noteA.startBeat) continue;
			if (noteB.startBeat >= aEnd) continue;

			const dist = Math.abs(pitchKey(noteA.pitch) - pitchKey(noteB.pitch));
			if (dist < bestDistance) {
				bestDistance = dist;
				bestMatch = noteB;
			}
		}

		if (!bestMatch) continue;

		const slideStartBeat = bestMatch.startBeat - noteA.startBeat;
		const slideEndBeat = noteA.endBeat - noteA.startBeat;

		const currentPitchAtSlideStart = noteA.slides
			? evaluateSlide(noteA.pitch, noteA.slides, slideStartBeat)
			: noteA.pitch;

		const holdKeyframe: ScoreNoteSlide = { beat: slideStartBeat, pitch: currentPitchAtSlideStart, curve: 0 };
		const targetKeyframe: ScoreNoteSlide = { beat: slideEndBeat, pitch: bestMatch.pitch, curve: 0 };

		const newSlides = [holdKeyframe, targetKeyframe];
		const key = `${noteA.startBeat}:${noteA.endBeat}:${pitchKey(noteA.pitch)}`;

		if (noteA.slides) {
			slideMap.set(key, [...mergeSlides(noteA.slides, newSlides)]);
		} else {
			slideMap.set(key, newSlides);
		}
	}

	if (slideMap.size === 0) {
		return new SlidePattern(pattern, pattern);
	}

	const transformed = mapNotes(pattern, (note, absoluteOffset) => {
		const absStart = absoluteOffset + note.startBeat;
		const absEnd = absoluteOffset + note.endBeat;
		const key = `${absStart}:${absEnd}:${pitchKey(note.pitch)}`;
		const newSlides = slideMap.get(key);

		if (newSlides) {
			return { ...note, slides: newSlides };
		}

		return note;
	});

	return new SlidePattern(pattern, transformed);
}
