import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../../rendering/schedule-notes";
import { addSteps } from "../../utils/pitch";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedNote } from "../pattern";
import { MidiPattern } from "../pattern";

export interface UnisonSpread {
	readonly pitch?: number;
	readonly cc?: Partial<Record<number, number>>;
}

export class UnisonPattern extends MidiPattern {
	readonly type = "unison" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly child: Pattern,
		readonly voices: number,
		readonly spread: UnisonSpread = {},
	) {
		super();

		this.durationBeats = child.durationBeats;

		const result: Array<PositionedNote> = [];

		for (const positionedNote of child.notes) {
			for (let voiceIndex = 0; voiceIndex < voices; voiceIndex++) {
				const offset = Math.round((voiceIndex - (voices - 1) / 2) * (spread.pitch ?? 0));
				const voiceNote: PositionedNote = {
					...positionedNote,
					pitch: addSteps(positionedNote.pitch, offset),
				};

				if (spread.cc) {
					const mergedCc: Partial<Record<number, number>> = { ...positionedNote.cc };

					for (const [ccKey, ccSpread] of Object.entries(spread.cc)) {
						const ccNum = Number(ccKey);
						const baseVal = positionedNote.cc?.[ccNum] ?? 64;

						mergedCc[ccNum] = Math.round(baseVal + (voiceIndex - (voices - 1) / 2) * (ccSpread ?? 0));
					}

					result.push({ ...voiceNote, cc: mergedCc });
				} else {
					result.push(voiceNote);
				}
			}
		}

		this.notes = result;
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

export function unison(pattern: Pattern, voices: number, spread?: UnisonSpread): UnisonPattern {
	return new UnisonPattern(pattern, voices, spread);
}
