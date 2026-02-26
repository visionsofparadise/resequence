import type { ScheduleContext } from "../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../rendering/schedule-notes";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "./pattern";
import { MidiPattern } from "./pattern";

export class SequencePattern extends MidiPattern {
	readonly type = "sequence" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(readonly children: ReadonlyArray<Pattern>) {
		super();

		this.durationBeats = children.reduce((sum, child) => sum + child.durationBeats, 0);

		const notes: Array<ScoreNote> = [];
		const metadatas: Array<PositionedMetadata> = [];
		const automations: Array<PositionedAutomation> = [];

		let cursor = 0;

		for (const child of children) {
			for (const childNote of child.notes) {
				notes.push({ ...childNote, beat: childNote.beat + cursor });
			}

			for (const positioned of child.metadatas) {
				metadatas.push({ beat: positioned.beat + cursor, meta: positioned.meta });
			}

			for (const positioned of child.automations) {
				automations.push({ beat: positioned.beat + cursor, automation: positioned.automation });
			}

			cursor += child.durationBeats;
		}

		this.notes = notes;
		this.metadatas = metadatas;
		this.automations = automations;
	}

	validate(context: ValidateContext): void {
		if (this.children.length === 0) {
			context.warnings.push({ code: "EMPTY_CONTAINER", message: "sequence() has no children" });
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


	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		scheduleNotes(this.notes, offsetBeats, this.outputs, context);

		let cursor = offsetBeats;

		for (const child of this.children) {
			child.schedule(cursor, context);
			cursor += child.durationBeats;
		}
	}

	teardown(context: ScheduleContext): void {
		for (const child of this.children) {
			child.teardown(context);
		}
	}
}

export function sequence(...nodes: ReadonlyArray<Pattern>): SequencePattern {
	return new SequencePattern(nodes);
}
