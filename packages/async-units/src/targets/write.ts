import { writeFile } from "node:fs/promises";
import { TargetAsyncUnit, type TargetAsyncUnitProperties } from "../target";
import type { AsyncUnitInput, AudioChunk, StreamContext } from "../unit";
import { WaveFile } from "wavefile";

export type WavBitDepth = "16" | "24" | "32" | "32f";

export interface WriteProperties extends TargetAsyncUnitProperties {
	readonly path: string;
	readonly bitDepth: WavBitDepth;
}

export class WriteUnit extends TargetAsyncUnit {
	readonly type = ["async-unit", "target", "write"] as const;

	readonly properties: WriteProperties;

	private channelBuffers: Array<Array<Float32Array>> = [];
	private context?: StreamContext;

	constructor(properties: AsyncUnitInput<WriteProperties>) {
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

	override _setup(context: StreamContext): void {
		this.context = context;
		this.channelBuffers = [];

		for (let channel = 0; channel < context.channels; channel++) {
			this.channelBuffers.push([]);
		}
	}

	_write(chunk: AudioChunk): Promise<void> {
		for (let channel = 0; channel < chunk.samples.length; channel++) {
			const channelSamples = chunk.samples[channel];
			const channelBuffer = this.channelBuffers[channel];

			if (channelSamples && channelBuffer) {
				channelBuffer.push(channelSamples);
			}
		}

		return Promise.resolve();
	}

	async _close(): Promise<void> {
		if (!this.context) return;

		const channels = this.channelBuffers.map((chunks) => {
			const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
			const merged = new Float32Array(totalLength);
			let offset = 0;

			for (const chunk of chunks) {
				merged.set(chunk, offset);
				offset += chunk.length;
			}

			return merged;
		});

		const wav = new WaveFile();
		wav.fromScratch(this.context.channels, this.context.sampleRate, "32f", channels);

		if (this.properties.bitDepth !== "32f") {
			wav.toBitDepth(this.properties.bitDepth);
		}

		const bytes = wav.toBuffer();
		await writeFile(this.properties.path, bytes);

		this.channelBuffers = [];
	}

	clone(overrides?: Partial<WriteProperties>): WriteUnit {
		return new WriteUnit({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

export function write(path: string, options?: { bitDepth?: WavBitDepth }): WriteUnit {
	return new WriteUnit({
		path,
		bitDepth: options?.bitDepth ?? "16",
	});
}
