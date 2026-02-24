import { ResequenceError } from "../error";
import type { NoteContext } from "../nodes/node";
import type { ScheduleContext } from "../rendering/schedule-context";
import { ticksToSeconds } from "../rendering/ticks-to-seconds";
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

	constructor(
		readonly pitch: Pitch,
		readonly duration: Duration,
		readonly velocity: number,
		readonly lyric?: string,
	) {
		super();

		if (velocity < 0 || velocity > 127) {
			throw new ResequenceError("INVALID_VELOCITY", `note(): velocity must be 0-127, got ${velocity}`);
		}

		this.durationTicks = resolveDuration(duration);
	}

	transpose(interval: number): NotePattern {
		const midi = resolvePitch(this.pitch) + interval;

		return new NotePattern(midi, this.duration, this.velocity, this.lyric);
	}

	reverse(): NotePattern {
		return new NotePattern(this.pitch, this.duration, this.velocity, this.lyric);
	}

	validate(context: ValidateContext): void {
		if (!context.insideRoute && this.outputs.length === 0) {
			context.warnings.push({
				code: "ORPHANED_NOTES",
				message: `Note '${this.pitch}' is not routed to any instrument — it won't produce sound`,
			});
		}
	}

	getMidi(offset = 0, trackName?: string): Array<PositionedNote> {
		return [
			{
				tick: offset,
				pitch: resolvePitch(this.pitch),
				durationTicks: this.durationTicks,
				velocity: this.velocity,
				lyric: this.lyric,
				trackName: this.resolveTrackName(trackName),
			},
		];
	}

	prepare(offsetTicks: number, context: ScheduleContext): void {
		if (offsetTicks + this.durationTicks <= context.fromTicks || offsetTicks >= context.toTicks) return;
		if (context.activeNodes.length === 0) return;

		const midi = resolvePitch(this.pitch);
		const startTime = ticksToSeconds(offsetTicks, context.tempo);
		const stopTime = ticksToSeconds(offsetTicks + this.durationTicks, context.tempo);

		const noteCtx: NoteContext = {
			frequency: midiToFrequency(midi),
			velocity: this.velocity,
			startTime,
			stopTime,
			cleanupTime: stopTime + 5,
		};

		for (const node of context.activeNodes) {
			node.prepare(noteCtx, context);
		}
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (offsetTicks + this.durationTicks <= context.fromTicks || offsetTicks >= context.toTicks) return;
		if (context.activeNodes.length === 0) return;

		const midi = resolvePitch(this.pitch);
		const startTime = ticksToSeconds(offsetTicks, context.tempo);
		const stopTime = ticksToSeconds(offsetTicks + this.durationTicks, context.tempo);

		const noteCtx: NoteContext = {
			frequency: midiToFrequency(midi),
			velocity: this.velocity,
			startTime,
			stopTime,
			cleanupTime: stopTime + 5,
		};

		for (const node of context.activeNodes) {
			node.schedule(noteCtx, context);
		}
	}
}

function midiToFrequency(midi: number): number {
	return 440 * 2 ** ((midi - 69) / 12);
}

export function note(pitch: Pitch, duration: Duration, options?: { velocity?: number; lyric?: string }): NotePattern {
	return new NotePattern(pitch, duration, options?.velocity ?? 100, options?.lyric);
}
