import { readFile } from "node:fs/promises";
import { SourceAsyncUnit, type SourceAsyncUnitProperties } from "../source";
import type { AsyncUnitInput, AudioChunk, StreamContext } from "../unit";
import { WaveFile } from "wavefile";

export interface ReadProperties extends SourceAsyncUnitProperties {
	readonly path: string;
}

const DEFAULT_CHUNK_SIZE = 44100;

export class ReadUnit extends SourceAsyncUnit {
	readonly type = ["async-unit", "source", "read"] as const;

	readonly properties: ReadProperties;

	private samples: Array<Float32Array> = [];
	private sampleRate = 0;
	private frameOffset = 0;
	private totalFrames = 0;

	constructor(properties: AsyncUnitInput<ReadProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [] };
	}

	// eslint-disable-next-line @typescript-eslint/class-literal-property-style
	get bufferSize(): number {
		return 0;
	}

	// eslint-disable-next-line @typescript-eslint/class-literal-property-style
	get latency(): number {
		return 0;
	}

	async _init(): Promise<StreamContext> {
		const data = await readFile(this.properties.path);
		const wav = new WaveFile(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
		wav.toBitDepth("32f");
		const fmt = wav.fmt as { sampleRate: number; numChannels: number };
		const rawSamples = wav.getSamples(false, Float64Array) as unknown;

		this.sampleRate = fmt.sampleRate;
		const numChannels = fmt.numChannels;

		if (numChannels === 1) {
			this.samples = [new Float32Array(rawSamples as Float64Array)];
		} else {
			this.samples = (rawSamples as Array<Float64Array>).map((channel) => new Float32Array(channel));
		}

		this.totalFrames = this.samples[0]?.length ?? 0;
		this.frameOffset = 0;

		return {
			sampleRate: this.sampleRate,
			channels: numChannels,
			duration: this.totalFrames,
		};
	}

	_read(controller: ReadableStreamDefaultController<AudioChunk>): Promise<void> {
		if (this.frameOffset >= this.totalFrames) {
			controller.close();
			return Promise.resolve();
		}

		const chunkFrames = Math.min(DEFAULT_CHUNK_SIZE, this.totalFrames - this.frameOffset);
		const chunkSamples = this.samples.map((channel) => channel.slice(this.frameOffset, this.frameOffset + chunkFrames));

		const offset = this.frameOffset;
		this.frameOffset += chunkFrames;

		controller.enqueue({
			samples: chunkSamples,
			offset,
			duration: chunkFrames,
		});

		return Promise.resolve();
	}

	_flush(_controller: ReadableStreamDefaultController<AudioChunk>): Promise<void> {
		return Promise.resolve();
	}

	clone(overrides?: Partial<ReadProperties>): ReadUnit {
		return new ReadUnit({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

export function read(path: string): ReadUnit {
	return new ReadUnit({ path });
}
