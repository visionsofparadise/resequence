import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export interface StrumOptions {
	readonly strumOffset?: number;
	readonly direction?: "up" | "down";
}

export class StrumPattern extends MidiPattern {
	readonly type = "strum" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly options: StrumOptions = {},
	) {
		super();

		this.durationTicks = child.durationTicks;

		const strumOffset = options.strumOffset ?? 15;
		const direction = options.direction ?? "up";

		const byTick = new Map<number, Array<PositionedNote>>();

		for (const positionedNote of child.notes) {
			let group = byTick.get(positionedNote.tick);

			if (!group) {
				group = [];
				byTick.set(positionedNote.tick, group);
			}
			group.push(positionedNote);
		}

		const result: Array<PositionedNote> = [];

		for (const group of byTick.values()) {
			const sorted = direction === "up" ? group.slice().sort((noteA, noteB) => noteA.pitch - noteB.pitch) : group.slice().sort((noteA, noteB) => noteB.pitch - noteA.pitch);

			sorted.forEach((positionedNote, voiceIndex) => {
				result.push({ ...positionedNote, tick: positionedNote.tick + voiceIndex * strumOffset });
			});
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

export function strum(pattern: Pattern, options?: StrumOptions): StrumPattern {
	return new StrumPattern(pattern, options);
}
