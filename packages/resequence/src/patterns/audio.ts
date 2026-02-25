import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import { beatsToSeconds } from "../rendering/tempo-map";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedNote } from "./pattern";

export class AudioPattern implements Pattern {
	readonly type = "audio" as const;
	readonly durationBeats: number;
	readonly notes: ReadonlyArray<PositionedNote> = [];

	constructor(
		readonly name: string,
		readonly path: string, // FIX: We should support regions here too
		readonly duration: Duration | undefined,
		readonly transposeSemitones: number,
		readonly reversed: boolean,
		readonly loopStartMs?: number,
		readonly loopEndMs?: number,
	) {
		if (!path) {
			throw new ResequenceError("EMPTY_AUDIO_PATH", "audio(): path must not be empty");
		}

		this.durationBeats = duration !== undefined ? resolveDuration(duration) : 0; // FIX duration 0 is a problem
	}

	validate(_context: ValidateContext): void {
		return;
	}

	setup(_context: ScheduleContext): void {
		return;
	}

	prepare(_offsetBeats: number, _context: ScheduleContext): void {
		return;
	}

	teardown(_context: ScheduleContext): void {
		return;
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (context.trackFilter && !context.trackFilter.has(this.name)) return;
		if (offsetBeats + this.durationBeats <= context.fromBeats || offsetBeats >= context.toBeats) return;

		const buffer = context.sampleMap.get(this.path);
		if (!buffer) return;

		const offsetSeconds = beatsToSeconds(offsetBeats, context.tempoMap);
		const source = context.audioContext.createBufferSource();

		if (this.reversed) {
			source.buffer = copyReversed(buffer, context.audioContext);
		} else {
			source.buffer = buffer;
		}

		if (this.transposeSemitones !== 0) {
			source.playbackRate.value = 2 ** (this.transposeSemitones / 12);
		}

		if (this.loopStartMs !== undefined && this.loopEndMs !== undefined) {
			source.loop = true;
			source.loopStart = this.loopStartMs / 1000;
			source.loopEnd = this.loopEndMs / 1000;
		}

		const destination = context.nodeMap.get(this.name) ?? context.audioContext.destination;
		const durationSeconds = this.durationBeats > 0 ? beatsToSeconds(this.durationBeats, context.tempoMap) : buffer.duration;

		source.connect(destination);
		source.start(offsetSeconds);
		source.stop(offsetSeconds + durationSeconds);
	}
}

function copyReversed(buffer: AudioBuffer, audioCtx: BaseAudioContext): AudioBuffer {
	const reversed = audioCtx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);

	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		const original = buffer.getChannelData(channel);
		const output = reversed.getChannelData(channel);

		for (let sampleIdx = 0; sampleIdx < original.length; sampleIdx++) {
			output[sampleIdx] = original[original.length - 1 - sampleIdx] ?? 0;
		}
	}

	return reversed;
}

export function audio(name: string, path: string, duration?: Duration, options?: { loopStartMs?: number; loopEndMs?: number }): AudioPattern {
	return new AudioPattern(name, path, duration, 0, false, options?.loopStartMs, options?.loopEndMs);
}
