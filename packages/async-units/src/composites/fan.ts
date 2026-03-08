import { TransformAsyncUnit, type TransformAsyncUnitProperties } from "../transform";
import type { AsyncUnitInput, AudioChunk } from "../unit";

export interface FanTransformProperties extends TransformAsyncUnitProperties {
	readonly branches: ReadonlyArray<TransformAsyncUnit>;
}

export class FanTransform extends TransformAsyncUnit {
	readonly type = ["async-unit", "transform", "fan"] as const;

	readonly properties: FanTransformProperties;

	private readonly writers: Array<WritableStreamDefaultWriter<AudioChunk>> = [];

	constructor(properties: AsyncUnitInput<FanTransformProperties>) {
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

	_transform(chunk: AudioChunk, controller: TransformStreamDefaultController<AudioChunk>): Promise<void> {
		controller.enqueue(chunk);

		return Promise.resolve();
	}

	_flush(_controller: TransformStreamDefaultController<AudioChunk>): Promise<void> {
		return Promise.resolve();
	}

	clone(overrides?: Partial<FanTransformProperties>): FanTransform {
		return new FanTransform({ ...this.properties, previousProperties: this.properties, ...overrides });
	}
}

export function fan(...branches: Array<TransformAsyncUnit>): FanTransform {
	return new FanTransform({ branches });
}
