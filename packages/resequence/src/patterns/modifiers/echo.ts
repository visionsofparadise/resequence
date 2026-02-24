import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class EchoPattern extends MidiPattern {
	readonly type = "echo" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly interval: number,
		readonly repeats: number,
		readonly decay: number,
	) {
		super();

		this.durationTicks = child.durationTicks;

		const result: Array<PositionedNote> = [];

		for (const positionedNote of child.notes) {
			result.push(positionedNote);

			for (let echoIndex = 1; echoIndex <= repeats; echoIndex++) {
				const echoVelocity = Math.round((positionedNote.velocity ?? 100) * decay ** echoIndex);

				result.push({
					...positionedNote,
					tick: positionedNote.tick + echoIndex * interval,
					velocity: Math.max(1, echoVelocity),
				});
			}
		}

		this.notes = result;
	}

	validate(context: ValidateContext): void {
		const childContext = this.outputs.length > 0 ? { ...context, insideRoute: true } : context;

		this.child.validate(childContext);
	}

	prepare(offsetTicks: number, context: ScheduleContext): void {
		if (!isInScope(offsetTicks, this.durationTicks, context)) return;

		prepareNotes(this.notes, offsetTicks, this.outputs, context);
		this.child.prepare(offsetTicks, context);
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (!isInScope(offsetTicks, this.durationTicks, context)) return;

		scheduleNotes(this.notes, offsetTicks, this.outputs, context);
		this.child.schedule(offsetTicks, context);
	}
}

export function echo(pattern: Pattern, interval: Duration | number, repeats: number, decay: number): EchoPattern {
	return new EchoPattern(pattern, resolveDuration(interval), repeats, decay);
}
