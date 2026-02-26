import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../rendering/schedule-notes";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { Pitch } from "../utils/pitch";
import { resolvePitch } from "../utils/pitch";
import type { ValidateContext } from "../validate";
import type { ScoreNote } from "./pattern";
import { MidiPattern } from "./pattern";

export class NotePattern extends MidiPattern {
	readonly type = "note" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<ScoreNote>;

	constructor(
		readonly pitch: string | number | Pitch,
		readonly duration: Duration,
		readonly velocity: number,
		readonly lyric?: string,
		readonly cc?: Partial<Record<number, number>>,
	) {
		super();

		if (velocity < 0 || velocity > 127) {
			throw new ResequenceError("INVALID_VELOCITY", `note(): velocity must be 0-127, got ${velocity}`);
		}

		this.durationBeats = resolveDuration(duration);
		this.notes = [{ beat: 0, pitch: resolvePitch(this.pitch), durationBeats: this.durationBeats, velocity: this.velocity, lyric: this.lyric, cc: this.cc, outputs: [] }];
	}

	validate(context: ValidateContext): void {
		if (!context.insideRoute && this.outputs.length === 0) {
			context.warnings.push({
				code: "ORPHANED_NOTES",
				message: `Note '${typeof this.pitch === "object" ? `${this.pitch.class}/${this.pitch.stepsPerOctave}:${this.pitch.octave}` : String(this.pitch)}' is not routed to any instrument — it won't produce sound`,
			});
		}
	}


	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (!isInScope(offsetBeats, this.durationBeats, context)) return;

		scheduleNotes(this.notes, offsetBeats, this.outputs, context);
	}
}

export function note(pitch: string | number | Pitch, duration: Duration, options?: { velocity?: number; lyric?: string; cc?: Partial<Record<number, number>> }): NotePattern {
	return new NotePattern(pitch, duration, options?.velocity ?? 100, options?.lyric, options?.cc);
}
