import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class AccentPattern extends MidiPattern {
	readonly type = "accent" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly positions: ReadonlyArray<number>,
		readonly amount: number,
	) {
		super();

		this.durationTicks = child.durationTicks;

		const cycle = positions.reduce((sum, pos) => sum + pos, 0);

		const accentedTicks = new Set<number>();

		if (cycle > 0) {
			const relativeOffsets: Array<number> = [];
			let cursor = 0;

			for (const pos of positions) {
				relativeOffsets.push(cursor);
				cursor += pos;
			}

			let start = 0;

			while (start < child.durationTicks) {
				for (const relOffset of relativeOffsets) {
					accentedTicks.add(start + relOffset);
				}

				start += cycle;
			}
		}

		this.notes = child.notes.map((positionedNote) => {
			if (accentedTicks.has(positionedNote.tick)) {
				return { ...positionedNote, velocity: Math.min(127, (positionedNote.velocity ?? 100) + amount) };
			}

			return positionedNote;
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

export function accent(pattern: Pattern, positions: ReadonlyArray<Duration | number>, amount: number): AccentPattern {
	return new AccentPattern(pattern, positions.map(resolveDuration), amount);
}
