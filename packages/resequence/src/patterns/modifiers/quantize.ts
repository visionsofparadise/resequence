import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import { note } from "../note";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";
import { sequence } from "../sequence";

export class QuantizePattern extends MidiPattern {
	readonly type = "quantize" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly subdivision: Duration | number,
		readonly grooveMap?: Pattern,
	) {
		super();

		this.durationBeats = child.durationBeats;

		const grid = resolveDuration(subdivision);

		if (!grooveMap) {
			this.notes = child.notes.map((positionedNote) => {
				const remainder = positionedNote.beat % grid;
				const base = positionedNote.beat - remainder;
				return { ...positionedNote, beat: base + (remainder <= grid / 2 ? 0 : grid) };
			});
		} else {
			const groovePositions = grooveMap.notes.map((positionedNote) => positionedNote.beat % grid).sort((tickA, tickB) => tickA - tickB);

			this.notes = child.notes.map((positionedNote) => {
				const cycle = Math.floor(positionedNote.beat / grid);
				const remainder = positionedNote.beat % grid;
				const nearest = groovePositions.reduce((best, grooveTick) => (Math.abs(grooveTick - remainder) < Math.abs(best - remainder) ? grooveTick : best), groovePositions[0] ?? 0);

				return { ...positionedNote, beat: cycle * grid + nearest };
			});
		}
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

export function quantize(pattern: Pattern, subdivision: Duration | number, grooveMap?: Pattern): QuantizePattern {
	return new QuantizePattern(pattern, subdivision, grooveMap);
}

function buildSwingMap(amount: number): Pattern {
	return sequence(note(0, amount), note(0, 1 - amount));
}

export function shuffle(pattern: Pattern, amount: number): QuantizePattern {
	return quantize(pattern, "4n", buildSwingMap(amount));
}
