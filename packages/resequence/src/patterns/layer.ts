import type { ScheduleContext } from "../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../rendering/schedule-notes";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedNote } from "./pattern";
import { MidiPattern } from "./pattern";

export class LayerPattern extends MidiPattern {
	readonly type = "layer" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly children: ReadonlyArray<Pattern>,
		readonly duration?: Duration,
	) {
		super();

		this.durationBeats = duration !== undefined ? resolveDuration(duration) : Math.max(0, ...children.map((child) => child.durationBeats));

		const notes: Array<PositionedNote> = [];

		for (const child of children) {
			notes.push(...child.notes);
		}

		this.notes = notes;
	}

	validate(context: ValidateContext): void {
		if (this.children.length === 0) {
			context.warnings.push({ code: "EMPTY_CONTAINER", message: "layer() has no children" });
		}

		const childContext = this.outputs.length > 0 ? { ...context, insideRoute: true } : context;

		for (const child of this.children) {
			child.validate(childContext);
		}
	}

	setup(context: ScheduleContext): void {
		for (const child of this.children) {
			child.setup(context);
		}
	}

	prepare(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		prepareNotes(this.notes, offsetBeats, this.outputs, context);

		for (const child of this.children) {
			child.prepare(offsetBeats, context);
		}
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		scheduleNotes(this.notes, offsetBeats, this.outputs, context);

		for (const child of this.children) {
			child.schedule(offsetBeats, context);
		}
	}

	teardown(context: ScheduleContext): void {
		for (const child of this.children) {
			child.teardown(context);
		}
	}
}

export function layer(...nodes: ReadonlyArray<Pattern>): LayerPattern {
	return new LayerPattern(nodes);
}
