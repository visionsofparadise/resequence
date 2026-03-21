import type { Keyframe } from "../events";
import type { Note } from "../note";
import type { ModifierProperties } from "../patterns/modifier";
import { ModifierPattern } from "../patterns/modifier";
import type { Pattern, PatternProperties } from "../patterns/pattern";
import { toPattern } from "../patterns/sequence";
import type { Pitch } from "../pitch";
import { flatMapNotes } from "../utils/map";
import { evaluateSlide } from "../utils/slide";

export interface ChopProperties extends ModifierProperties {
	readonly subdivision: number;
}

export class ChopPattern extends ModifierPattern<ChopProperties> {
	readonly type = ["pattern", "midi", "modifier", "chop"] as const;

	static override is(value: unknown): value is ChopPattern {
		return ModifierPattern.is(value) && value.type[3] === "chop";
	}

	clone(overrides: Partial<PatternProperties>): ChopPattern {
		return new ChopPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function chop(pattern: Pattern | Note, subdivision: number): ChopPattern {
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
		notes: transformed.notes,
		children: transformed.children,
		startBeat: transformed.startBeat,
		endBeat: transformed.endBeat,
		subdivision,
		input: resolved,
	});
}
