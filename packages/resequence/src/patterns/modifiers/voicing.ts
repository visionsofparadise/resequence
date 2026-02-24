import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export type VoicingStyle = "close" | "drop2" | "drop3" | "open";

export class VoicingPattern extends MidiPattern {
	readonly type = "voicing" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly style: VoicingStyle,
	) {
		super();

		this.durationTicks = child.durationTicks;

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
			result.push(...applyVoicing(group, style));
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

function applyVoicing(group: ReadonlyArray<PositionedNote>, style: VoicingStyle): Array<PositionedNote> {
	if (group.length < 2) return group.slice();
	const sorted = group.slice().sort((noteA, noteB) => noteA.pitch - noteB.pitch);
	const firstSorted = sorted[0];
	if (firstSorted === undefined) return group.slice();
	const base = firstSorted.pitch;

	// Close voicing: pack all notes within one octave above the lowest
	const close = sorted.map((positionedNote, groupIndex) => {
		if (groupIndex === 0) return positionedNote;
		let pitch = positionedNote.pitch;

		while (pitch > base + 12) pitch -= 12;
		while (pitch <= base) pitch += 12;

		return { ...positionedNote, pitch };
	});

	if (style === "close") return close;

	if (style === "drop2") {
		const voiced = close.slice();
		const secondFromTop = voiced[voiced.length - 2];

		if (secondFromTop) {
			voiced[voiced.length - 2] = { ...secondFromTop, pitch: secondFromTop.pitch - 12 };
		}

		return voiced;
	}

	if (style === "drop3") {
		const voiced = close.slice();

		const thirdFromTop = voiced[voiced.length - 3];
		if (thirdFromTop) {
			voiced[voiced.length - 3] = { ...thirdFromTop, pitch: thirdFromTop.pitch - 12 };
		}

		return voiced;
	}

	// open: alternate notes up an octave (every other note from the top)
	const voiced = close.slice();

	for (let noteIndex = voiced.length - 1; noteIndex >= 0; noteIndex -= 2) {
		const positionedNote = voiced[noteIndex];
		if (positionedNote === undefined) continue;
		voiced[noteIndex] = { ...positionedNote, pitch: positionedNote.pitch + 12 };
	}

	return voiced;
}

export function voicing(pattern: Pattern, style: VoicingStyle): VoicingPattern {
	return new VoicingPattern(pattern, style);
}
