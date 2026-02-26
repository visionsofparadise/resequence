import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class FlamPattern extends MidiPattern {
	readonly type = "flam" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly flamOffset: number,
		readonly graceVelocity: number,
	) {
		super();

		this.durationBeats = child.durationBeats;

		const result: Array<ScoreNote> = [];

		for (const positionedNote of child.notes) {
			result.push({
				...positionedNote,
				beat: Math.max(0, positionedNote.beat - flamOffset),
				velocity: graceVelocity,
				durationBeats: flamOffset,
			});

			result.push(positionedNote);
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

export function flam(pattern: Pattern, flamOffset: Duration | number, graceVelocity = 40): FlamPattern {
	return new FlamPattern(pattern, resolveDuration(flamOffset), graceVelocity);
}
