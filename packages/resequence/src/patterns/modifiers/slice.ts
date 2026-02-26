import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class SlicePattern extends MidiPattern {
	readonly type = "slice" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly from: number,
		readonly to: number,
	) {
		super();

		this.metadatas = child.metadatas;
		this.automations = child.automations;

		const sorted = child.notes.slice().sort((noteA, noteB) => noteA.beat - noteB.beat);
		const kept = sorted.slice(from, to);

		if (kept.length === 0) {
			this.durationBeats = 0;
			this.notes = [];

			return;
		}

		const firstEntry = kept[0];
		const lastNote = kept[kept.length - 1];

		if (firstEntry === undefined || lastNote === undefined) {
			this.durationBeats = 0;
			this.notes = [];
			return;
		}

		const firstTick = firstEntry.beat;

		this.durationBeats = lastNote.beat + (lastNote.durationBeats ?? 0) - firstTick;
		this.notes = kept.map((positionedNote) => ({ ...positionedNote, beat: positionedNote.beat - firstTick }));
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

export class TrimPattern extends MidiPattern {
	readonly type = "trim" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly fromBeats: number,
		readonly toBeats: number,
	) {
		super();

		this.durationBeats = Math.max(0, toBeats - fromBeats);

		const result: Array<ScoreNote> = [];

		for (const positionedNote of child.notes) {
			const noteStart = positionedNote.beat;
			const noteEnd = positionedNote.beat + (positionedNote.durationBeats ?? 0);
			const overlapStart = Math.max(noteStart, fromBeats);
			const overlapEnd = Math.min(noteEnd, toBeats);

			if (overlapEnd > overlapStart) {
				result.push({
					...positionedNote,
					beat: overlapStart - fromBeats,
					durationBeats: overlapEnd - overlapStart,
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

export function slice(pattern: Pattern, from: number, to: number): SlicePattern {
	return new SlicePattern(pattern, from, to);
}

export function trim(pattern: Pattern, from: Duration | number, to: Duration | number): TrimPattern {
	return new TrimPattern(pattern, resolveDuration(from), resolveDuration(to));
}
