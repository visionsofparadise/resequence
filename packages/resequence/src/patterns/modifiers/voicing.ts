import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import { addSteps, pitchKey } from "../../utils/pitch";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";

export type VoicingStyle = "close" | "drop2" | "drop3" | "open";

export class VoicingPattern extends MidiPattern {
	readonly type = "voicing" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly style: VoicingStyle,
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
			result.push(...applyVoicing(group, style));
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

function applyVoicing(group: ReadonlyArray<ScoreNote>, style: VoicingStyle): Array<ScoreNote> {
	if (group.length < 2) return group.slice();
	const sorted = group.slice().sort((noteA, noteB) => pitchKey(noteA.pitch) - pitchKey(noteB.pitch));
	const firstSorted = sorted[0];
	if (firstSorted === undefined) return group.slice();
	const baseKey = pitchKey(firstSorted.pitch);
	const spo = firstSorted.pitch.stepsPerOctave;

	// Close voicing: pack all notes within one octave above the lowest
	const close = sorted.map((positionedNote, groupIndex) => {
		if (groupIndex === 0) return positionedNote;
		let pitch = positionedNote.pitch;

		while (pitchKey(pitch) > baseKey + spo) pitch = addSteps(pitch, -spo);
		while (pitchKey(pitch) <= baseKey) pitch = addSteps(pitch, spo);

		return { ...positionedNote, pitch };
	});

	if (style === "close") return close;

	if (style === "drop2") {
		const voiced = close.slice();
		const secondFromTop = voiced[voiced.length - 2];

		if (secondFromTop) {
			voiced[voiced.length - 2] = { ...secondFromTop, pitch: addSteps(secondFromTop.pitch, -spo) };
		}

		return voiced;
	}

	if (style === "drop3") {
		const voiced = close.slice();

		const thirdFromTop = voiced[voiced.length - 3];
		if (thirdFromTop) {
			voiced[voiced.length - 3] = { ...thirdFromTop, pitch: addSteps(thirdFromTop.pitch, -spo) };
		}

		return voiced;
	}

	// open: alternate notes up an octave (every other note from the top)
	const voiced = close.slice();

	for (let noteIndex = voiced.length - 1; noteIndex >= 0; noteIndex -= 2) {
		const positionedNote = voiced[noteIndex];
		if (positionedNote === undefined) continue;
		voiced[noteIndex] = { ...positionedNote, pitch: addSteps(positionedNote.pitch, spo) };
	}

	return voiced;
}

export function voicing(pattern: Pattern, style: VoicingStyle): VoicingPattern {
	return new VoicingPattern(pattern, style);
}
