import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class EchoPattern extends MidiPattern {
	readonly type = "echo" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly interval: number,
		readonly repeats: number,
		readonly decay: number,
	) {
		super();

		this.durationBeats = child.durationBeats;

		const result: Array<ScoreNote> = [];

		for (const positionedNote of child.notes) {
			result.push(positionedNote);

			for (let echoIndex = 1; echoIndex <= repeats; echoIndex++) {
				const echoVelocity = Math.round((positionedNote.velocity ?? 100) * decay ** echoIndex);

				result.push({
					...positionedNote,
					beat: positionedNote.beat + echoIndex * interval,
					velocity: Math.max(1, echoVelocity),
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

export function echo(pattern: Pattern, interval: Duration | number, repeats: number, decay: number): EchoPattern {
	return new EchoPattern(pattern, resolveDuration(interval), repeats, decay);
}
