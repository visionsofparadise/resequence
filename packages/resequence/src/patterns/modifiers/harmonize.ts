import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import { addSteps } from "../../utils/pitch";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class HarmonizePattern extends MidiPattern {
	readonly type = "harmonize" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly interval: number,
	) {
		super();

		this.durationBeats = child.durationBeats;

		const result: Array<ScoreNote> = [];

		for (const positionedNote of child.notes) {
			result.push(positionedNote);
			result.push({ ...positionedNote, pitch: addSteps(positionedNote.pitch, interval) });
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

export function harmonize(pattern: Pattern, interval: number): HarmonizePattern {
	return new HarmonizePattern(pattern, interval);
}
