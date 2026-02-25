import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class GatePattern extends MidiPattern {
	readonly type = "gate" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly gatePattern: Pattern,
	) {
		super();

		this.durationBeats = child.durationBeats;

		const result: Array<PositionedNote> = [];

		for (const positionedNote of child.notes) {
			const noteStart = positionedNote.beat;
			const noteEnd = positionedNote.beat + (positionedNote.durationBeats ?? 0);

			for (const gateNote of gatePattern.notes) {
				const winStart = gateNote.beat;
				const winEnd = gateNote.beat + (gateNote.durationBeats ?? 0);
				const overlapStart = Math.max(noteStart, winStart);
				const overlapEnd = Math.min(noteEnd, winEnd);

				if (overlapEnd > overlapStart) {
					result.push({
						...positionedNote,
						beat: overlapStart,
						durationBeats: overlapEnd - overlapStart,
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

	prepare(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		prepareNotes(this.notes, offsetBeats, this.outputs, context);
		this.child.prepare(offsetBeats, context);
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		scheduleNotes(this.notes, offsetBeats, this.outputs, context);
		this.child.schedule(offsetBeats, context);
	}
}

export function gate(pattern: Pattern, gatePattern: Pattern): GatePattern {
	return new GatePattern(pattern, gatePattern);
}
