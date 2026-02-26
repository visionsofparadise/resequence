import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class LengthPattern extends MidiPattern {
	readonly type = "length" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly noteDuration: number,
	) {
		super();

		this.durationBeats = child.durationBeats;

		this.notes = child.notes.map((positionedNote) => {
			const truncatedSlides = positionedNote.slides?.filter((sl) => sl.beat <= noteDuration);
			return {
				...positionedNote,
				durationBeats: noteDuration,
				slides: truncatedSlides && truncatedSlides.length > 0 ? truncatedSlides : undefined,
			};
		});
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

export function length(pattern: Pattern, duration: Duration | number): LengthPattern {
	return new LengthPattern(pattern, resolveDuration(duration));
}
