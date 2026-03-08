import { AsyncUnit, type AsyncUnitProperties, type AudioChunk } from "./unit";

export interface TransformAsyncUnitProperties extends AsyncUnitProperties {}

export abstract class TransformAsyncUnit extends AsyncUnit {
	declare readonly properties: TransformAsyncUnitProperties;

	static override is(value: unknown): value is TransformAsyncUnit {
		return AsyncUnit.is(value) && value.type[1] === "transform";
	}

	abstract _transform(chunk: AudioChunk, controller: TransformStreamDefaultController<AudioChunk>): Promise<void>;

	abstract _flush(controller: TransformStreamDefaultController<AudioChunk>): Promise<void>;

	createTransform(): TransformStream<AudioChunk, AudioChunk> {
		return new TransformStream<AudioChunk, AudioChunk>({
			transform: (chunk, controller) => this._transform(chunk, controller),
			flush: (controller) => this._flush(controller),
		});
	}
}
