import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { EffectsChain } from "../instrument/effect";
import type { ScheduleContext } from "../rendering/schedule-context";
import { ticksToSeconds } from "../rendering/ticks-to-seconds";
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
	) {
		this.durationTicks = duration !== undefined ? resolveDuration(duration) : 0;
	}

	transpose(interval: number): SamplePattern {
		return new SamplePattern(this.name, this.path, this.duration, this.transposeSemitones + interval, this.reversed, this.effects);
	}

	reverse(): SamplePattern {
		return new SamplePattern(this.name, this.path, this.duration, this.transposeSemitones, !this.reversed, this.effects);
	}

	routeTo(effectsChain: EffectsChain): SamplePattern {
		return new SamplePattern(this.name, this.path, this.duration, this.transposeSemitones, this.reversed, effectsChain);
	}

	getMidi(): Array<PositionedNote> {
		return [];
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (context.trackFilter && !context.trackFilter.has(this.name)) return;
		if (offsetTicks + this.durationTicks <= context.fromTicks || offsetTicks >= context.toTicks) return;

		const buffer = context.sampleBank.get(this.path);
		if (!buffer) return;

		const offsetSeconds = ticksToSeconds(offsetTicks, context.tempo);
		const source = context.audioContext.createBufferSource();

		if (this.reversed) {
			const reversed = copyReversed(buffer, context.audioContext);
			source.buffer = reversed;
		} else {
			source.buffer = buffer;
		}

		if (this.transposeSemitones !== 0) {
			source.playbackRate.value = 2 ** (this.transposeSemitones / 12);
		}

		const effectsEntry = context.effectsMap.get(this.name);
		const destination = effectsEntry?.input ?? context.audioContext.destination;
		source.connect(destination);
		source.start(offsetSeconds);
	}
}

function copyReversed(buffer: AudioBuffer, audioCtx: BaseAudioContext): AudioBuffer {
	const reversed = audioCtx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);

	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		const original = buffer.getChannelData(channel);
		const output = reversed.getChannelData(channel);
		for (let sample = 0; sample < original.length; sample++) {
			output[sample] = original[original.length - 1 - sample]!;
		}
	}

	return reversed;
}

export function sample(name: string, path: string, duration?: Duration): SamplePattern {
	return new SamplePattern(name, path, duration, 0, false);
}
