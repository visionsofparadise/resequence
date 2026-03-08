import { TransformAsyncUnit, type TransformAsyncUnitProperties } from "../transform";
import type { AsyncUnitInput, AudioChunk } from "../unit";

export interface FanTransformProperties extends TransformAsyncUnitProperties {
	readonly branches: ReadonlyArray<TransformAsyncUnit>;
}

export class FanTransform extends TransformAsyncUnit {
	readonly type = ["async-unit", "transform", "fan"] as const;

	readonly properties: FanTransformProperties;
	readonly bufferSize = 0;
	readonly latency = 0;

	private readonly writers: Array<WritableStreamDefaultWriter<AudioChunk>> = [];

	constructor(properties: AsyncUnitInput<FanTransformProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [] };
	}

	override createTransform(): TransformStream<AudioChunk, AudioChunk> {
		const branchStreams = this.properties.branches.map((unit) => unit.createTransform());

		const writers = branchStreams.map((stream) => stream.writable.getWriter());
		this.writers.push(...writers);

		return new TransformStream<AudioChunk, AudioChunk>({
			transform: async (chunk, _controller) => {
				await Promise.all(writers.map((writer) => writer.write(chunk)));
			},
			flush: async () => {
				await Promise.all(writers.map((writer) => writer.close()));
			},
		});
	}

	clone(overrides?: Partial<FanTransformProperties>): FanTransform {
		return new FanTransform({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

export function fan(...branches: Array<TransformAsyncUnit>): FanTransform {
	return new FanTransform({ branches });
}
