import type { Event, Keyframe, Note, ModifierProperties, Pattern, PatternProperties, Pitch } from "@resequence/patterns-core";
import { ModifierPattern, toPattern, flatModifyNotes } from "@resequence/patterns-core";
import { evaluateSlide } from "@resequence/patterns-utils";
export interface ChopProperties extends ModifierProperties {
	readonly subdivision: number;
}

export class ChopPattern extends ModifierPattern<ChopProperties> {
	readonly packageName = "@resequence/patterns";
	readonly unitName = "chop";

	override _setup(): Array<Event> {
		flatModifyNotes(this, (note) => {
			const duration = note.endBeat - note.startBeat;
			const chopCount = Math.floor(duration / this.properties.subdivision);
			const result = [];

			for (let chopIndex = 0; chopIndex < chopCount; chopIndex++) {
				const chopStart = chopIndex * this.properties.subdivision;
				const chopEnd = chopStart + this.properties.subdivision;

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

		return [];
	}

	clone(_overrides: Partial<PatternProperties>): ChopPattern {
		return new ChopPattern({ subdivision: this.properties.subdivision, input: this.properties.input });
	}
}

export function chop(pattern: Pattern | Note, subdivision: number): ChopPattern {
	const resolved = toPattern(pattern);

	return new ChopPattern({ subdivision, input: resolved });
}
