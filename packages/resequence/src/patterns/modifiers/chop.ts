import type { OptionalProperties } from "../../utils/RequiredProperties";
import type { Keyframe } from "../../automation/keyframe";
import type { Pitch } from "../../utils/pitch";
import { evaluateSlide } from "../../utils/slide";
import type { ScoreNote } from "../note";
import type { Pattern, PatternProperties } from "../pattern";
import { toPattern } from "../sequence";
import { flatMapNotes } from "../utils/tree";
import { ModifierPattern, type ModifierProperties } from "./modifier";

export interface ChopProperties extends ModifierProperties {
	readonly subdivision: number;
}

export class ChopPattern extends ModifierPattern {
	readonly type = ["pattern", "midi", "modifier", "chop"] as const;
	readonly properties: ChopProperties;

	static is(value: unknown): value is ChopPattern {
		return ModifierPattern.is(value) && value.type[3] === "chop";
	}

	constructor(properties: OptionalProperties<ChopProperties, "outputs">) {
		super(properties);

		this.properties = {
			...properties,
			outputs: properties.outputs ?? [],
		};
	}

	clone(overrides: Partial<PatternProperties>): ChopPattern {
		return new ChopPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
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
