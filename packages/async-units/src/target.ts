import { AsyncUnit, type AsyncUnitProperties, type AudioChunk } from "./unit";

export interface TargetAsyncUnitProperties extends AsyncUnitProperties {}

export abstract class TargetAsyncUnit extends AsyncUnit {
	declare readonly properties: TargetAsyncUnitProperties;

	static override is(value: unknown): value is TargetAsyncUnit {
		return AsyncUnit.is(value) && value.type[1] === "target";
	}

	abstract _write(chunk: AudioChunk): Promise<void>;
	abstract _close(): Promise<void>;

	createWritable(): WritableStream<AudioChunk> {
		return new WritableStream<AudioChunk>({
			write: (chunk) => this._write(chunk),
			close: () => this._close(),
		});
	}
}
