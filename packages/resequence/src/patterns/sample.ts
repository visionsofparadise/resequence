import { ResequenceError } from "../error";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { EffectsChain } from "../instrument/effect";
import type { EnvelopesChain } from "../instrument/envelope";
import { isEnvelopesChain } from "../instrument/envelope";
import type { ScheduleContext } from "../rendering/schedule-context";
import { ticksToSeconds } from "../rendering/ticks-to-seconds";
import type { ValidateContext } from "../validate";
import type { Pattern, PositionedNote } from "./pattern";

export class SamplePattern implements Pattern {
	readonly type = "sample" as const;
	readonly durationTicks: number;

	constructor(
		readonly name: string,
		readonly path: string,
		readonly duration: Duration | undefined,
		readonly transposeSemitones: number,
		readonly reversed: boolean,
		readonly effects?: EffectsChain,
		readonly envelopes?: EnvelopesChain,
		readonly loopStartMs?: number,
		readonly loopEndMs?: number,
	) {
		if (!path) {
			throw new ResequenceError('EMPTY_SAMPLE_PATH', 'sample(): path must not be empty');
		}

		this.durationTicks = duration !== undefined ? resolveDuration(duration) : 0;
	}

	transpose(interval: number): SamplePattern {
		return new SamplePattern(this.name, this.path, this.duration, this.transposeSemitones + interval, this.reversed, this.effects, this.envelopes, this.loopStartMs, this.loopEndMs);
	}

	reverse(): SamplePattern {
		return new SamplePattern(this.name, this.path, this.duration, this.transposeSemitones, !this.reversed, this.effects, this.envelopes, this.loopStartMs, this.loopEndMs);
	}

	routeTo(chain: EffectsChain | EnvelopesChain): SamplePattern {
		if (isEnvelopesChain(chain)) {
			return new SamplePattern(this.name, this.path, this.duration, this.transposeSemitones, this.reversed, this.effects, chain, this.loopStartMs, this.loopEndMs);
		}

		return new SamplePattern(this.name, this.path, this.duration, this.transposeSemitones, this.reversed, chain, this.envelopes, this.loopStartMs, this.loopEndMs);
	}

	validate(_context: ValidateContext): void {
		return;
	}

	getMidi(): Array<PositionedNote> {
		return [];
	}

	setup(_context: ScheduleContext): void {
		return;
	}

	teardown(_context: ScheduleContext): void {
		return;
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (context.trackFilter && !context.trackFilter.has(this.name)) return;
		if (offsetTicks + this.durationTicks <= context.fromTicks || offsetTicks >= context.toTicks) return;

		const buffer = context.sampleMap.get(this.path);
		if (!buffer) return;

		const offsetSeconds = ticksToSeconds(offsetTicks, context.tempo);
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

		const destination = context.effectsMap[this.name] ?? context.audioContext.destination;
		const durationSeconds = this.durationTicks > 0
			? ticksToSeconds(this.durationTicks, context.tempo)
			: buffer.duration;

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
		for (let sample = 0; sample < original.length; sample++) {
			output[sample] = original[original.length - 1 - sample] ?? 0;
		}
	}

	return reversed;
}

export function sample(name: string, path: string, duration?: Duration, options?: { loopStartMs?: number; loopEndMs?: number }): SamplePattern {
	return new SamplePattern(name, path, duration, 0, false, undefined, undefined, options?.loopStartMs, options?.loopEndMs);
}
