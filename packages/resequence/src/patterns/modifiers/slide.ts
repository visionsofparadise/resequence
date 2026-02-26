import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import { pitchKey } from "../../utils/pitch";
import { evaluateSlide, mergeSlides } from "../../utils/slide";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote, ScoreSlide } from "../pattern";
import { MidiPattern } from "../pattern";

export class SlidePattern extends MidiPattern {
	readonly type = "slide" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(readonly child: Pattern) {
		super();

		this.durationBeats = child.durationBeats;
		this.notes = applySlides(child.notes);
		this.metadatas = child.metadatas;
		this.automations = child.automations;
	}

	validate(context: ValidateContext): void {
		const childContext = this.outputs.length > 0 ? { ...context, insideRoute: true } : context;

		this.child.validate(childContext);
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		scheduleNotes(this.notes, offsetBeats, this.outputs, context);

		this.child.schedule(offsetBeats, context);
	}
}

function applySlides(notes: ReadonlyArray<ScoreNote>): ReadonlyArray<ScoreNote> {
	if (notes.length < 2) return notes;

	const byOutput = new Map<string | undefined, Array<ScoreNote>>();

	for (const sn of notes) {
		const key = sn.outputs.length > 0 ? sn.outputs[0] : undefined;
		let group = byOutput.get(key);
		if (!group) {
			group = [];
			byOutput.set(key, group);
		}
		group.push(sn);
	}

	const slideMap = new Map<ScoreNote, Array<ScoreSlide>>();

	for (const group of byOutput.values()) {
		const sorted = [...group].sort((n1, n2) => n1.beat - n2.beat);

		for (const noteA of sorted) {
			const aEnd = noteA.beat + (noteA.durationBeats ?? 0);
			let bestMatch: ScoreNote | undefined;
			let bestDistance = Infinity;

			for (const noteB of sorted) {
				if (noteB.beat <= noteA.beat) continue;
				if (noteB.beat >= aEnd) continue;

				const dist = Math.abs(pitchKey(noteA.pitch) - pitchKey(noteB.pitch));
				if (dist < bestDistance) {
					bestDistance = dist;
					bestMatch = noteB;
				}
			}

			if (!bestMatch) continue;

			const slideStartBeat = bestMatch.beat - noteA.beat;
			const slideEndBeat = noteA.durationBeats ?? 0;

			const currentPitchAtSlideStart = noteA.slides
				? evaluateSlide(noteA.pitch, noteA.slides, slideStartBeat)
				: noteA.pitch;

			const holdKeyframe: ScoreSlide = { beat: slideStartBeat, pitch: currentPitchAtSlideStart, curve: 0 };
			const targetKeyframe: ScoreSlide = { beat: slideEndBeat, pitch: bestMatch.pitch, curve: 0 };

			const newSlides = [holdKeyframe, targetKeyframe];

			if (noteA.slides) {
				slideMap.set(noteA, [...mergeSlides(noteA.slides, newSlides)]);
			} else {
				slideMap.set(noteA, newSlides);
			}
		}
	}

	if (slideMap.size === 0) return notes;

	return notes.map((sn) => {
		const newSlides = slideMap.get(sn);
		if (!newSlides) return sn;
		return { ...sn, slides: newSlides };
	});
}

export function slide(pattern: Pattern): SlidePattern {
	return new SlidePattern(pattern);
}
