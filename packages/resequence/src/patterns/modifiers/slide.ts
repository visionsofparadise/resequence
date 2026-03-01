import type { Keyframe } from "../../automation/keyframe";
import { normalizePitch, pitchKey } from "../../utils/pitch";
import { evaluateSlide, mergeSlides } from "../../utils/slide";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import type { OptionalProperties } from "../../utils/RequiredProperties";
import { mapNotes, walkNotes } from "../utils/tree";
import { ModifierPattern } from "./modifier";
import type { ModifierProperties } from "./modifier";

export class SlidePattern extends ModifierPattern {
	readonly properties: ModifierProperties;

	constructor(properties: OptionalProperties<ModifierProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): SlidePattern {
		return new SlidePattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function slide(pattern: Pattern | ScoreNote): SlidePattern {
	const resolved = toPattern(pattern);
	const entries: Array<{ id: string; absoluteStart: number; absoluteEnd: number; note: ScoreNote }> = [];
	walkNotes(resolved, (note, { id, absoluteOffset }) => {
		entries.push({ id, absoluteStart: absoluteOffset + note.startBeat, absoluteEnd: absoluteOffset + note.endBeat, note });
	});

	if (entries.length < 2) {
		return new SlidePattern({
			notes: resolved.notes,
			children: resolved.children,
			startBeat: resolved.startBeat,
			endBeat: resolved.endBeat,
			input: resolved,
		});
	}

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

	if (slideMap.size === 0) {
		return new SlidePattern({
			notes: resolved.notes,
			children: resolved.children,
			startBeat: resolved.startBeat,
			endBeat: resolved.endBeat,
			input: resolved,
		});
	}

	const transformed = mapNotes(resolved, (note, { id }) => {
		const newSlides = slideMap.get(id);

		if (newSlides) {
			return { ...note, slides: newSlides };
		}

		return note;
	});

	return new SlidePattern({
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		input: resolved,
	});
}
