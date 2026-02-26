import type { ScheduleContext } from "../../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../../rendering/schedule-notes";
import { addSteps } from "../../utils/pitch";
import type { ValidateContext } from "../../validate";
import type { Pattern, PositionedAutomation, PositionedMetadata, ScoreNote } from "../pattern";
import { MidiPattern } from "../pattern";

export interface UnisonSpread {
	readonly pitch?: number;
	readonly cc?: Partial<Record<number, number>>;
}

export class UnisonPattern extends MidiPattern {
	readonly type = "unison" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;
	readonly metadatas: ReadonlyArray<PositionedMetadata>;
	readonly automations: ReadonlyArray<PositionedAutomation>;

	constructor(
		readonly child: Pattern,
		readonly voices: number,
		readonly spread: UnisonSpread = {},
	) {
		super();

		this.durationBeats = child.durationBeats;

		const result: Array<ScoreNote> = [];

		for (const positionedNote of child.notes) {
			for (let voiceIndex = 0; voiceIndex < voices; voiceIndex++) {
				const offset = Math.round((voiceIndex - (voices - 1) / 2) * (spread.pitch ?? 0));
				const voiceNote: ScoreNote = {
					...positionedNote,
					pitch: addSteps(positionedNote.pitch, offset),
					slides: positionedNote.slides?.map((sl) => ({ ...sl, pitch: addSteps(sl.pitch, offset) })),
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

export function unison(pattern: Pattern, voices: number, spread?: UnisonSpread): UnisonPattern {
	return new UnisonPattern(pattern, voices, spread);
}
