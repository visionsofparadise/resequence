import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import { isInScope, prepareNotes, scheduleNotes } from "../rendering/schedule-notes";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { Pitch } from "../utils/pitch";
import { resolvePitch } from "../utils/pitch";
import type { ValidateContext } from "../validate";
import type { PositionedNote } from "./pattern";
import { MidiPattern } from "./pattern";

export class NotePattern extends MidiPattern {
	readonly type = "note" as const;
	readonly durationTicks: number;
	readonly notes: ReadonlyArray<PositionedNote>;

	constructor(
		readonly pitch: Pitch,
		readonly duration: Duration,
		readonly velocity: number,
		readonly lyric?: string,
		readonly cc?: Partial<Record<number, number>>,
	) {
		super();

		if (velocity < 0 || velocity > 127) {
			throw new ResequenceError("INVALID_VELOCITY", `note(): velocity must be 0-127, got ${velocity}`);
		}

		this.durationTicks = resolveDuration(duration);
		this.notes = [{ tick: 0, pitch: resolvePitch(this.pitch), durationTicks: this.durationTicks, velocity: this.velocity, lyric: this.lyric, cc: this.cc, outputs: [] }];
	}

	validate(context: ValidateContext): void {
		if (!context.insideRoute && this.outputs.length === 0) {
			context.warnings.push({
				code: "ORPHANED_NOTES",
				message: `Note '${this.pitch}' is not routed to any instrument — it won't produce sound`,
			});
		}
	}

	prepare(offsetTicks: number, context: ScheduleContext): void {
		if (!isInScope(offsetTicks, this.durationTicks, context)) return;

		prepareNotes(this.notes, offsetTicks, this.outputs, context);
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (!isInScope(offsetTicks, this.durationTicks, context)) return;

		scheduleNotes(this.notes, offsetTicks, this.outputs, context);
	}
}

export function note(pitch: Pitch, duration: Duration, options?: { velocity?: number; lyric?: string; cc?: Partial<Record<number, number>> }): NotePattern {
	return new NotePattern(pitch, duration, options?.velocity ?? 100, options?.lyric, options?.cc);
}
