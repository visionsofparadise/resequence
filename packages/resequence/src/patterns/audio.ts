import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import { beatsToSeconds } from "../rendering/tempo-map";
import type { PatternProperties } from "./pattern";
import { Pattern } from "./pattern";

export interface AudioProperties extends PatternProperties {
	readonly name: string;
	readonly path: string;
	readonly duration: number;
	readonly durationBeats: number;
	readonly playFromBeats: number;
	readonly transposeSemitones: number;
	readonly reversed: boolean;
	readonly sampleKey: string;
	readonly region: string | undefined;
}

export class AudioPattern extends Pattern {
	readonly type = ["pattern", "audio"] as const;
	private buffer: AudioBuffer | undefined;

	static is(value: unknown): value is AudioPattern {
		return Pattern.is(value) && value.type[1] === "audio";
	}

	constructor(readonly properties: AudioProperties) {
		super(properties);
	}

	async setup(context: ScheduleContext): Promise<void> {
		try {
			this.buffer = await context.getSample(this.properties.sampleKey);
		} catch {
			// sample not loadable — skip
		}
	}

	teardown(_context: ScheduleContext): void {
		this.buffer = undefined;
	}

	clone(overrides: Partial<PatternProperties>): AudioPattern {
		return new AudioPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}

	schedule(offsetBeats: number, context: ScheduleContext): void {
		if (context.trackFilter && !context.trackFilter.has(this.properties.name)) return;
		if (offsetBeats + this.properties.endBeat <= context.fromBeats || offsetBeats + this.properties.startBeat >= context.toBeats) return;

		const buffer = this.buffer;
		if (!buffer) return;

		const offsetSeconds = beatsToSeconds(offsetBeats, context.tempoMap);
		const source = context.audioContext.createBufferSource();

		if (this.properties.reversed) {
			source.buffer = copyReversed(buffer, context.audioContext);
		} else {
			source.buffer = buffer;
		}

		if (this.properties.transposeSemitones !== 0) {
			source.playbackRate.value = 2 ** (this.properties.transposeSemitones / 12);
		}

		const playFromSeconds = this.properties.playFromBeats * (buffer.duration / this.properties.durationBeats);
		const destination = context.audioContext.destination;
		const durationSeconds = beatsToSeconds(this.properties.durationBeats, context.tempoMap);

		source.connect(destination);
		source.start(offsetSeconds, playFromSeconds);
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

export function audio(name: string, path: string, duration: number, options?: { region?: string; playFromBeats?: number }): AudioPattern {
	if (!path) {
		throw new ResequenceError("EMPTY_AUDIO_PATH", "audio(): path must not be empty");
	}

	const region = options?.region;
	const sampleKey = region && !path.includes("#") ? `${path}#${region}` : path;
	const playFromBeats = options?.playFromBeats ?? 0;

	return new AudioPattern({
		notes: [], children: [], startBeat: 0, endBeat: duration - playFromBeats,
		name, path, duration, durationBeats: duration, playFromBeats, transposeSemitones: 0, reversed: false,
		sampleKey, region,
	});
}
