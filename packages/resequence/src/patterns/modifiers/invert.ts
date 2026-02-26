import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import { addSteps, pitchKey } from "../../utils/pitch";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class InvertPattern extends MidiPattern {
	readonly type = "invert" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly n: number,
	) {
		super();
		this.durationBeats = child.durationBeats;

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
			const sorted = group.slice().sort((noteA, noteB) => pitchKey(noteA.pitch) - pitchKey(noteB.pitch));

			if (n > 0) {
				for (const [noteIndex, positionedNote] of sorted.entries()) {
					result.push(noteIndex < n ? { ...positionedNote, pitch: addSteps(positionedNote.pitch, positionedNote.pitch.stepsPerOctave) } : positionedNote);
				}
			} else if (n < 0) {
				const count = -n;
				for (const [noteIndex, positionedNote] of sorted.entries()) {
					result.push(noteIndex >= sorted.length - count ? { ...positionedNote, pitch: addSteps(positionedNote.pitch, -positionedNote.pitch.stepsPerOctave) } : positionedNote);
				}
			} else {
				result.push(...sorted);
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

export function invertChord(pattern: Pattern, inversions: number): InvertPattern {
	return new InvertPattern(pattern, inversions);
}
