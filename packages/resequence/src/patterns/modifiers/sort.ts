import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import { addSteps, pitchKey } from "../../utils/pitch";
import type { Pitch } from "../../utils/pitch";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";

export type SortKey = "asc" | "desc" | ((noteA: ScoreNote, noteB: ScoreNote) => number);

export class SortPattern extends MidiPattern {
	readonly type = "sort" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly key: SortKey = "asc",
	) {
		super();

		this.durationBeats = child.durationBeats;

		// Notes ordered by tick — these define the timing slots
		const byTick = child.notes.slice().sort((noteA, noteB) => noteA.beat - noteB.beat);

		// Pitches in sorted order, to assign into the timing slots
		let pitches: Array<Pitch>;

		if (typeof key === "function") {
			pitches = child.notes
				.slice()
				.sort(key)
				.map((positionedNote) => positionedNote.pitch);
		} else if (key === "desc") {
			pitches = byTick.map((positionedNote) => positionedNote.pitch).sort((pitchA, pitchB) => pitchKey(pitchB) - pitchKey(pitchA));
		} else {
			pitches = byTick.map((positionedNote) => positionedNote.pitch).sort((pitchA, pitchB) => pitchKey(pitchA) - pitchKey(pitchB));
		}

		this.notes = byTick.map((positionedNote, noteIndex) => {
			const newPitch = pitches[noteIndex] ?? positionedNote.pitch;
			const shift = pitchKey(newPitch) - pitchKey(positionedNote.pitch);
			return {
				...positionedNote,
				pitch: newPitch,
				slides: positionedNote.slides?.map((sl) => ({ ...sl, pitch: addSteps(sl.pitch, shift) })),
			};
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

export function sort(pattern: Pattern, key?: SortKey): SortPattern {
	return new SortPattern(pattern, key);
}
