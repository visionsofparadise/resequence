import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import { beatsToSeconds } from "../rendering/tempo-map";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { PatternNode } from "./pattern";
import { Pattern } from "./pattern";

export class AudioPattern extends Pattern {
	constructor(
		readonly name: string,
		readonly path: string,
		readonly duration: Duration,
		readonly durationBeats: number,
		readonly transposeSemitones: number,
		readonly reversed: boolean,
		readonly sampleKey: string,
		readonly region: string | undefined,
		readonly loopStartMs: number | undefined,
		readonly loopEndMs: number | undefined,
		node: PatternNode,
	) {
		super(node);
	}

	get sampleKeys(): ReadonlySet<string> {
		return new Set([this.sampleKey]);
	}

	clone(overrides: Partial<PatternNode>): AudioPattern {
		return new AudioPattern(
			this.name, this.path, this.duration, this.durationBeats,
			this.transposeSemitones, this.reversed, this.sampleKey,
			this.region, this.loopStartMs, this.loopEndMs,
			this.overrideNode(overrides),
		);
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (context.trackFilter && !context.trackFilter.has(this.name)) return;
		if (offsetBeats + this.endBeat <= context.fromBeats || offsetBeats + this.startBeat >= context.toBeats) return;

		const buffer = context.sampleMap.get(this.sampleKey);
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

		const destination = context.audioContext.destination;
		const durationSeconds = beatsToSeconds(this.durationBeats, context.tempoMap);

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

export function audio(name: string, path: string, duration: Duration, options?: { region?: string; loopStartMs?: number; loopEndMs?: number }): AudioPattern {
	if (!path) {
		throw new ResequenceError("EMPTY_AUDIO_PATH", "audio(): path must not be empty");
	}

	const region = options?.region;
	const sampleKey = region && !path.includes("#") ? `${path}#${region}` : path;
	const durationBeats = resolveDuration(duration);

	return new AudioPattern(name, path, duration, durationBeats, 0, false, sampleKey, region, options?.loopStartMs, options?.loopEndMs, { notes: [], children: [], startBeat: 0, endBeat: durationBeats });
}
