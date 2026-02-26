import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import type { Duration } from "../../utils/duration";
import { resolveDuration } from "../../utils/duration";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class AccentPattern extends MidiPattern {
	readonly type = "accent" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly positions: ReadonlyArray<number>,
		readonly amount: number,
	) {
		super();

		this.durationBeats = child.durationBeats;

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

			while (start < child.durationBeats) {
				for (const relOffset of relativeOffsets) {
					accentedTicks.add(start + relOffset);
				}

				start += cycle;
			}
		}

		this.notes = child.notes.map((positionedNote) => {
			if (accentedTicks.has(positionedNote.beat)) {
				return { ...positionedNote, velocity: Math.min(127, (positionedNote.velocity ?? 100) + amount) };
			}

			return positionedNote;
		});
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

export function accent(pattern: Pattern, positions: ReadonlyArray<Duration | number>, amount: number): AccentPattern {
	return new AccentPattern(pattern, positions.map(resolveDuration), amount);
}
