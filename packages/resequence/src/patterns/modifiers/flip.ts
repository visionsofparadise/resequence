import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import type { Pitch } from "../../utils/pitch";
import { addSteps, pitchKey, resolvePitch } from "../../utils/pitch";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export class FlipPattern extends MidiPattern {
	readonly type = "flip" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly center: Pitch,
		readonly range?: [Pitch, Pitch],
	) {
		super();

		this.durationBeats = child.durationBeats;
		const centerKey = pitchKey(center);

		this.notes = child.notes.map((positionedNote) => {
			const spo = positionedNote.pitch.stepsPerOctave;
			const newKey = centerKey * 2 - pitchKey(positionedNote.pitch);
			const newOctave = Math.floor(newKey / spo);
			const newClass = ((newKey % spo) + spo) % spo;
			let pitch: Pitch = { ...positionedNote.pitch, class: newClass, octave: newOctave };

			if (range) {
				const rangeMinKey = pitchKey(range[0]);
				const rangeMaxKey = pitchKey(range[1]);
				while (pitchKey(pitch) < rangeMinKey) pitch = addSteps(pitch, spo);
				while (pitchKey(pitch) > rangeMaxKey) pitch = addSteps(pitch, -spo);
			}

			return { ...positionedNote, pitch };
		});
	}

	validate(context: ValidateContext): void {
		const childContext = this.outputs.length > 0 ? { ...context, insideRoute: true } : context;
		this.child.validate(childContext);
	}

	prepare(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;
		prepareNotes(this.notes, offsetBeats, this.outputs, context);
		this.child.prepare(offsetBeats, context);
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;
		scheduleNotes(this.notes, offsetBeats, this.outputs, context);
		this.child.schedule(offsetBeats, context);
	}
}

export function flip(pattern: Pattern, center: string | number | Pitch, range?: [string | number | Pitch, string | number | Pitch]): FlipPattern {
	const centerPitch = resolvePitch(center);
	const resolvedRange: [Pitch, Pitch] | undefined = range ? [resolvePitch(range[0]), resolvePitch(range[1])] : undefined;
	return new FlipPattern(pattern, centerPitch, resolvedRange);
}
