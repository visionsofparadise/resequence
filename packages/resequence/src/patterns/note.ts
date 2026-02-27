import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import { isInScope, scheduleNotes } from "../rendering/schedule-notes";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { Pitch } from "../utils/pitch";
import { resolvePitch } from "../utils/pitch";
import type { ValidateContext } from "../validate";
import type { ScoreNote, ScoreSlide } from "./pattern";
import { MidiPattern } from "./pattern";

export interface SlideInput {
	readonly time: Duration;
	readonly pitch: Pitch;
	readonly curve?: number;
}

// FIX: Patterns should use Pitch and beats only
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
		readonly slideInputs?: ReadonlyArray<SlideInput>,
	) {
		super();

		if (velocity < 0 || velocity > 127) {
			throw new ResequenceError("INVALID_VELOCITY", `note(): velocity must be 0-127, got ${velocity}`);
		}

		this.durationBeats = resolveDuration(duration);

		const slides = this.slideInputs ? this.resolveSlides(this.slideInputs, this.durationBeats) : undefined;

		this.notes = [{ beat: 0, pitch: resolvePitch(this.pitch), durationBeats: this.durationBeats, velocity: this.velocity, lyric: this.lyric, cc: this.cc, slides, outputs: [] }];
	}

	private resolveSlides(inputs: ReadonlyArray<SlideInput>, durationBeats: number): ReadonlyArray<ScoreSlide> {
		const resolved = inputs.map((input) => {
			const beat = resolveDuration(input.time);
			const curve = Math.max(-1, Math.min(1, input.curve ?? 0));

			if (beat < 0) {
				throw new ResequenceError("INVALID_SLIDE", `note(): slide time must not be negative, got ${beat}`);
			}
			if (beat > durationBeats) {
				throw new ResequenceError("INVALID_SLIDE", `note(): slide time ${beat} exceeds note duration ${durationBeats}`);
			}

			return { beat, pitch: input.pitch, curve };
		});

		return resolved.sort((s1, s2) => s1.beat - s2.beat);
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

export function note(
	pitch: string | number | Pitch,
	duration: Duration,
	options?: { velocity?: number; lyric?: string; cc?: Partial<Record<number, number>>; slides?: ReadonlyArray<SlideInput> },
): NotePattern {
	return new NotePattern(pitch, duration, options?.velocity ?? 100, options?.lyric, options?.cc, options?.slides);
}
