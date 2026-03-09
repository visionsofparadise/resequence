import { TransformAsyncUnit, type TransformAsyncUnitProperties } from "../transform";
import type { AsyncUnitInput, AudioChunk } from "../unit";

export interface DitherProperties extends TransformAsyncUnitProperties {
	readonly bitDepth: 16 | 24;
	readonly noiseShaping?: boolean;
}

export class DitherTransformUnit extends TransformAsyncUnit {
	readonly type = ["async-unit", "transform", "dither"] as const;

	declare readonly properties: DitherProperties;

	readonly bufferSize = 0;
	readonly latency = 0;

	private lastError = 0;

	constructor(properties: AsyncUnitInput<DitherProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [] };
	}

	override _unbuffer(chunk: AudioChunk): AudioChunk {
		const { bitDepth, noiseShaping } = this.properties;
		const quantizationLevels = Math.pow(2, bitDepth - 1);
		const lsb = 1 / quantizationLevels;

		const samples = chunk.samples.map((channel) => {
			const output = new Float32Array(channel.length);

			for (let index = 0; index < channel.length; index++) {
				const sample = channel[index] ?? 0;
				const tpdfNoise = (Math.random() - Math.random()) * lsb;

				let dithered = sample + tpdfNoise;

				if (noiseShaping) {
					dithered += this.lastError;
				}

				const quantized = Math.round(dithered * quantizationLevels) / quantizationLevels;

				if (noiseShaping) {
					this.lastError = dithered - quantized;
				}

				output[index] = quantized;
			}

			return output;
		});

		return { samples, offset: chunk.offset, duration: chunk.duration };
	}

	clone(overrides?: Partial<DitherProperties>): DitherTransformUnit {
		return new DitherTransformUnit({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

export function dither(bitDepth: 16 | 24, options?: {
	noiseShaping?: boolean;
	id?: string;
}): DitherTransformUnit {
	return new DitherTransformUnit({
		bitDepth,
		noiseShaping: options?.noiseShaping,
		id: options?.id,
	});
}
