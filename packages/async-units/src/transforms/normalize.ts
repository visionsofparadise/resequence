import type { ChunkBuffer } from "../chunk-buffer";
import { TransformAsyncUnit, type TransformAsyncUnitProperties } from "../transform";
import type { AsyncUnitInput, AudioChunk } from "../unit";

export interface NormalizeProperties extends TransformAsyncUnitProperties {
	readonly ceiling: number;
}

export class NormalizeTransformUnit extends TransformAsyncUnit {
	readonly type = ["async-unit", "transform", "normalize"] as const;

	readonly properties: NormalizeProperties;
	readonly bufferSize = Infinity;
	readonly latency = Infinity;

	private peak = 0;
	private scale = 1;

	constructor(properties: AsyncUnitInput<NormalizeProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [] };
	}

	override _buffer(chunk: AudioChunk): void {
		for (const channel of chunk.samples) {
			for (const sample of channel) {
				const absolute = Math.abs(sample);

				if (absolute > this.peak) this.peak = absolute;
			}
		}
	}

	override _process(_buffer: ChunkBuffer): void {
		this.scale = this.peak === 0 ? 1 : this.properties.ceiling / this.peak;
	}

	override _unbuffer(chunk: AudioChunk): AudioChunk {
		if (this.scale === 1) return chunk;

		const scaledSamples = chunk.samples.map((channel) => {
			const scaled = new Float32Array(channel.length);

			for (let index = 0; index < channel.length; index++) {
				scaled[index] = (channel[index] ?? 0) * this.scale;
			}

			return scaled;
		});

		return { samples: scaledSamples, offset: chunk.offset, duration: chunk.duration };
	}

	clone(overrides?: Partial<NormalizeProperties>): NormalizeTransformUnit {
		return new NormalizeTransformUnit({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

export function normalize(options?: { ceiling?: number; id?: string }): NormalizeTransformUnit {
	return new NormalizeTransformUnit({ ceiling: options?.ceiling ?? 1.0, id: options?.id });
}
