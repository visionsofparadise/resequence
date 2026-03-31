import type { Event, Keyframe, Note, Pattern, PatternProperties } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, normalizePitch, pitchKey, modifyNotes, walkNotes } from "@resequence/patterns-core";
import { evaluateSlide, mergeSlides } from "@resequence/patterns-utils";
export class SlidePattern extends ModifierPattern {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "slide";

	override _setup(): Array<Event> {
		const entries: Array<{ id: string; absoluteStart: number; absoluteEnd: number; note: Note }> = [];

		walkNotes(this, (note, { id, absoluteOffset }) => {
			entries.push({ id, absoluteStart: absoluteOffset + note.startBeat, absoluteEnd: absoluteOffset + note.endBeat, note });
		});

		if (entries.length < 2) return [];

		entries.sort((ea, eb) => ea.absoluteStart - eb.absoluteStart);

		const slideMap = new Map<string, Array<Keyframe>>();

		for (const entryA of entries) {
			const aEnd = entryA.absoluteEnd;
			let bestMatch: (typeof entries)[number] | undefined;
			let bestDistance = Infinity;

			for (const entryB of entries) {
				if (entryB.absoluteStart <= entryA.absoluteStart) continue;
				if (entryB.absoluteStart >= aEnd) continue;

				const dist = Math.abs(pitchKey(entryA.note.pitch) - pitchKey(entryB.note.pitch));

				if (dist < bestDistance) {
					bestDistance = dist;
					bestMatch = entryB;
				}
			}

			if (!bestMatch) continue;

			const slideStartBeat = bestMatch.absoluteStart - entryA.absoluteStart;
			const slideEndBeat = entryA.absoluteEnd - entryA.absoluteStart;

			const currentPitchAtSlideStart = entryA.note.slides ? evaluateSlide(entryA.note.pitch, entryA.note.slides, slideStartBeat) : entryA.note.pitch;

			const holdKeyframe: Keyframe = { beat: slideStartBeat, value: normalizePitch(currentPitchAtSlideStart) };
			const targetKeyframe: Keyframe = { beat: slideEndBeat, value: normalizePitch(bestMatch.note.pitch) };

			const newSlides = [holdKeyframe, targetKeyframe];

			if (entryA.note.slides) {
				slideMap.set(entryA.id, [...mergeSlides(entryA.note.slides, newSlides)]);
			} else {
				slideMap.set(entryA.id, newSlides);
			}
		}

		if (slideMap.size === 0) return [];

		modifyNotes(this, (note, { id }) => {
			const newSlides = slideMap.get(id);

			if (newSlides) {
				return { ...note, slides: newSlides };
			}

			return note;
		});

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): SlidePattern {
		return new SlidePattern({ input: this.properties.input });
	}
}

export function slide(pattern: Pattern | Note): SlidePattern {
	const resolved = toPattern(pattern);

	return new SlidePattern({ input: resolved });
}
