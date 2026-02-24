import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class GatePattern extends MidiPattern {
	readonly type = "gate" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly gatePattern: Pattern,
	) {
		super();

		this.durationTicks = child.durationTicks;

		const result: Array<PositionedNote> = [];

		for (const positionedNote of child.notes) {
			const noteStart = positionedNote.tick;
			const noteEnd = positionedNote.tick + (positionedNote.durationTicks ?? 0);

			for (const gateNote of gatePattern.notes) {
				const winStart = gateNote.tick;
				const winEnd = gateNote.tick + (gateNote.durationTicks ?? 0);
				const overlapStart = Math.max(noteStart, winStart);
				const overlapEnd = Math.min(noteEnd, winEnd);

				if (overlapEnd > overlapStart) {
					result.push({
						...positionedNote,
						tick: overlapStart,
						durationTicks: overlapEnd - overlapStart,
					});
				}
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

export function gate(pattern: Pattern, gatePattern: Pattern): GatePattern {
	return new GatePattern(pattern, gatePattern);
}
