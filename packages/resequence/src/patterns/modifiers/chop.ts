import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import { evaluateSlide } from "../../utils/slide";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote, ScoreSlide } from "../pattern";
import { MidiPattern } from "../pattern";

export class ChopPattern extends MidiPattern {
	readonly type = "chop" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly subdivision: number,
	) {
		super();
		this.durationBeats = child.durationBeats;

		const result: Array<ScoreNote> = [];

		for (const positionedNote of child.notes) {
			const duration = positionedNote.durationBeats ?? 0;
			const chopCount = Math.floor(duration / subdivision);

			for (let chopIndex = 0; chopIndex < chopCount; chopIndex++) {
				const chopStart = chopIndex * subdivision;
				const chopEnd = chopStart + subdivision;

				let pitch = positionedNote.pitch;
				let slides: ReadonlyArray<ScoreSlide> | undefined;

				if (positionedNote.slides && positionedNote.slides.length > 0) {
					pitch = evaluateSlide(positionedNote.pitch, positionedNote.slides, chopStart);
					const segmentSlides = positionedNote.slides
						.filter((sl) => sl.beat > chopStart && sl.beat <= chopEnd)
						.map((sl) => ({ ...sl, beat: sl.beat - chopStart }));
					slides = segmentSlides.length > 0 ? segmentSlides : undefined;
				}

				result.push({
					...positionedNote,
					beat: positionedNote.beat + chopStart,
					durationBeats: subdivision,
					pitch,
					slides,
				});
			}
		}

		this.notes = result;
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

export function chop(pattern: Pattern, subdivision: Duration | number): ChopPattern {
	return new ChopPattern(pattern, resolveDuration(subdivision));
}
