import { TransformAsyncUnit, type TransformAsyncUnitProperties } from "../transform";
import type { AsyncUnitInput, AudioChunk } from "../unit";

export interface GainProperties extends TransformAsyncUnitProperties {
	readonly level: number;
}

export class GainTransformUnit extends TransformAsyncUnit {
	readonly type = ["async-unit", "transform", "gain"] as const;

	readonly properties: GainProperties;

	constructor(properties: AsyncUnitInput<GainProperties>) {
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

	_transform(chunk: AudioChunk, controller: TransformStreamDefaultController<AudioChunk>): Promise<void> {
		const { level } = this.properties;

		const scaledSamples = chunk.samples.map((channel) => {
			const scaled = new Float32Array(channel.length);

			for (let index = 0; index < channel.length; index++) {
				const sample = channel[index];

				if (sample !== undefined) scaled[index] = sample * level;
			}

			return scaled;
		});

		controller.enqueue({
			samples: scaledSamples,
			offset: chunk.offset,
			duration: chunk.duration,
		});

		return Promise.resolve();
	}

	_flush(_controller: TransformStreamDefaultController<AudioChunk>): Promise<void> {
		return Promise.resolve();
	}

	clone(overrides?: Partial<GainProperties>): GainTransformUnit {
		return new GainTransformUnit({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

export function gain(options: { level: number; id?: string }): GainTransformUnit {
	return new GainTransformUnit({ level: options.level, id: options.id });
}
