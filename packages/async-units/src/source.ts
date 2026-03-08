import type { TargetAsyncUnit } from "./target";
import type { TransformAsyncUnit } from "./transform";
import { AsyncUnit, type AsyncUnitProperties, type AudioChunk, type RenderOptions, type StreamContext } from "./unit";

export interface SourceAsyncUnitProperties extends AsyncUnitProperties {}

export abstract class SourceAsyncUnit extends AsyncUnit {
	declare readonly properties: SourceAsyncUnitProperties;

	static override is(value: unknown): value is SourceAsyncUnit {
		return AsyncUnit.is(value) && value.type[1] === "source";
	}

	protected readable?: ReadableStream<AudioChunk>;

	abstract _read(controller: ReadableStreamDefaultController<AudioChunk>): Promise<void>;
	abstract _flush(controller: ReadableStreamDefaultController<AudioChunk>): Promise<void>;
	abstract _init(): Promise<StreamContext>;

	async render(options?: RenderOptions): Promise<void> {
		const meta = await this._init();
		await this.setup(meta);

		try {
			this.readable = this.createReadable(options);
			const pipeline = this.buildPipeline(this, options);
			await pipeline;
		} finally {
			await this.teardown();
		}
	}

	private createReadable(options?: RenderOptions): ReadableStream<AudioChunk> {
		let done = false;
		return new ReadableStream<AudioChunk>(
			{
				pull: async (controller) => {
					if (done) return;
					try {
						await this._read(controller);
					} catch (error) {
						done = true;
						controller.error(error);
					}
				},
				cancel: () => {
					done = true;
				},
			},
			{
				highWaterMark: options?.highWaterMark ?? 1,
			},
		);
	}

	private buildPipeline(source: SourceAsyncUnit, _options?: RenderOptions): Promise<void> {
		let currentReadable = source.readable;
		if (!currentReadable) {
			return Promise.reject(new Error("Source readable not created"));
		}

		const targets = this.collectPipeline(source);

		for (const unit of targets) {
			if (isTransformAsyncUnit(unit)) {
				const transform = unit.createTransform();
				currentReadable = currentReadable.pipeThrough(transform);
			} else if (isTargetAsyncUnit(unit)) {
				const writable = unit.createWritable();
				return currentReadable.pipeTo(writable);
			}
		}

		// If no target, consume the stream to drive it
		return currentReadable.pipeTo(new WritableStream<AudioChunk>());
	}

	private collectPipeline(unit: AsyncUnit): Array<AsyncUnit> {
		const result: Array<AsyncUnit> = [];
		let current: AsyncUnit = unit;
		while (current.targets.length > 0) {
			const target = current.targets[0];
			if (!target) break;
			result.push(target);
			current = target;
		}
		return result;
	}
}

function isTransformAsyncUnit(value: unknown): value is TransformAsyncUnit {
	return AsyncUnit.is(value) && value.type[1] === "transform";
}

function isTargetAsyncUnit(value: unknown): value is TargetAsyncUnit {
	return AsyncUnit.is(value) && value.type[1] === "target";
}
