import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Pitch } from "../../utils/pitch";
import { resolvePitch } from "../../utils/pitch";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class FlipPattern extends MidiPattern {
	readonly type = "flip" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly center: number,
		readonly range?: [number, number],
	) {
		super();

		this.durationTicks = child.durationTicks;

		this.notes = child.notes.map((positionedNote) => {
			let pitch = center * 2 - positionedNote.pitch;

			if (range) {
				while (pitch < range[0]) pitch += 12;
				while (pitch > range[1]) pitch -= 12;
			}

			return { ...positionedNote, pitch };
		});
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

export function flip(pattern: Pattern, center: Pitch, range?: [Pitch, Pitch]): FlipPattern {
	const centerMidi = resolvePitch(center);
	const resolvedRange: [number, number] | undefined = range ? [resolvePitch(range[0]), resolvePitch(range[1])] : undefined;

	return new FlipPattern(pattern, centerMidi, resolvedRange);
}
