import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import { pitchKey } from "../../utils/pitch";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";

export interface StrumOptions {
	readonly strumOffset?: number;
	readonly direction?: "up" | "down";
}

export class StrumPattern extends MidiPattern {
	readonly type = "strum" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly options: StrumOptions = {},
	) {
		super();

		this.durationBeats = child.durationBeats;

		const strumOffset = options.strumOffset ?? 15;
		const direction = options.direction ?? "up";

		const byTick = new Map<number, Array<ScoreNote>>();

		for (const positionedNote of child.notes) {
			let group = byTick.get(positionedNote.beat);

			if (!group) {
				group = [];
				byTick.set(positionedNote.beat, group);
			}
			group.push(positionedNote);
		}

		const result: Array<ScoreNote> = [];

		for (const group of byTick.values()) {
			const sorted = direction === "up" ? group.slice().sort((noteA, noteB) => pitchKey(noteA.pitch) - pitchKey(noteB.pitch)) : group.slice().sort((noteA, noteB) => pitchKey(noteB.pitch) - pitchKey(noteA.pitch));

			sorted.forEach((positionedNote, voiceIndex) => {
				result.push({ ...positionedNote, beat: positionedNote.beat + voiceIndex * strumOffset });
			});
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

export function strum(pattern: Pattern, options?: StrumOptions): StrumPattern {
	return new StrumPattern(pattern, options);
}
