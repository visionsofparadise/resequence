import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import { note } from "../note";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";
import { sequence } from "../sequence";

export class QuantizePattern extends MidiPattern {
	readonly type = "quantize" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly subdivision: Duration | number,
		readonly grooveMap?: Pattern,
	) {
		super();

		this.durationTicks = child.durationTicks;

		const grid = resolveDuration(subdivision);

		if (!grooveMap) {
			this.notes = child.notes.map((positionedNote) => {
				const remainder = positionedNote.tick % grid;
				const base = positionedNote.tick - remainder;
				return { ...positionedNote, tick: base + (remainder <= grid / 2 ? 0 : grid) };
			});
		} else {
			const groovePositions = grooveMap.notes.map((positionedNote) => positionedNote.tick % grid).sort((tickA, tickB) => tickA - tickB);

			this.notes = child.notes.map((positionedNote) => {
				const cycle = Math.floor(positionedNote.tick / grid);
				const remainder = positionedNote.tick % grid;
				const nearest = groovePositions.reduce((best, grooveTick) => (Math.abs(grooveTick - remainder) < Math.abs(best - remainder) ? grooveTick : best), groovePositions[0] ?? 0);

				return { ...positionedNote, tick: cycle * grid + nearest };
			});
		}
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

export function quantize(pattern: Pattern, subdivision: Duration | number, grooveMap?: Pattern): QuantizePattern {
	return new QuantizePattern(pattern, subdivision, grooveMap);
}

function buildSwingMap(amount: number): Pattern {
	const quarterTicks = 480;
	const swungBeat = Math.round(amount * quarterTicks);

	return sequence(note(0, swungBeat), note(0, quarterTicks - swungBeat));
}

export function shuffle(pattern: Pattern, amount: number): QuantizePattern {
	return quantize(pattern, "4n", buildSwingMap(amount));
}
