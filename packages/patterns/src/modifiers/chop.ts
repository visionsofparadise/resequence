import type { Keyframe, Note, ModifierProperties, Pattern, PatternProperties, Pitch } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, flatModifyNotes } from "@resequence/patterns-core";
import { evaluateSlide } from "@resequence/patterns-utils";
export interface ChopProperties extends ModifierProperties {
	readonly subdivision: number;
}

export class ChopPattern extends ModifierPattern<ChopProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "chop";

	clone(overrides: Partial<PatternProperties>): ChopPattern {
		return new ChopPattern({
			...this.properties,
			...overrides,
		});
	}
}

export function chop(pattern: Pattern | Note, subdivision: number): ChopPattern {
	const resolved = toPattern(pattern);
	const cloned = resolved.clone({});

	flatModifyNotes(cloned, (note) => {
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
				const segmentSlides = note.slides.filter((sl) => sl.beat > chopStart && sl.beat <= chopEnd).map((sl) => ({ ...sl, beat: sl.beat - chopStart }));

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

	return new ChopPattern({
		notes: cloned.notes,
		children: cloned.children,
		startBeat: cloned.startBeat,
		endBeat: cloned.endBeat,
		subdivision,
		input: resolved,
	});
}
