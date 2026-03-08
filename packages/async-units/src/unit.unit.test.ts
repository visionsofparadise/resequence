import { describe, it, expect, vi } from "vitest";
import { AsyncUnit } from "./unit";
import { SourceAsyncUnit, type SourceAsyncUnitProperties } from "./source";
import { TransformAsyncUnit, type TransformAsyncUnitProperties } from "./transform";
import { TargetAsyncUnit, type TargetAsyncUnitProperties } from "./target";
import type { AudioChunk, StreamContext } from "./unit";

class MockSource extends SourceAsyncUnit {
	readonly type = ["async-unit", "source", "mock"] as const;
	declare readonly properties: SourceAsyncUnitProperties;
	readonly chunks: Array<AudioChunk>;
	private chunkIndex = 0;
	private readonly streamContext: StreamContext;

	constructor(chunks: Array<AudioChunk>, meta: StreamContext) {
		super();
		this.chunks = chunks;
		this.streamContext = meta;
	}

	get bufferSize(): number {
		return 0;
	}

	get latency(): number {
		return 0;
	}

	async _init(): Promise<StreamContext> {
		return this.streamContext;
	}

	async _read(controller: ReadableStreamDefaultController<AudioChunk>): Promise<void> {
		const chunk = this.chunks[this.chunkIndex];
		if (chunk) {
			this.chunkIndex++;
			controller.enqueue(chunk);
		} else {
			controller.close();
		}
	}

	async _flush(_controller: ReadableStreamDefaultController<AudioChunk>): Promise<void> {
		// no-op
	}

	clone(overrides?: Partial<SourceAsyncUnitProperties>): MockSource {
		const source = new MockSource(this.chunks, this.streamContext);
		if (overrides) Object.assign(source.properties, overrides);
		return source;
	}
}

class MockTransform extends TransformAsyncUnit {
	readonly type = ["async-unit", "transform", "mock"] as const;
	declare readonly properties: TransformAsyncUnitProperties;
	readonly processedChunks: Array<AudioChunk> = [];
	readonly bufferSize = 0;
	readonly latency = 0;

	override _buffer(chunk: AudioChunk): void {
		this.processedChunks.push(chunk);
	}

	clone(): MockTransform {
		return new MockTransform();
	}
}

class MockTarget extends TargetAsyncUnit {
	readonly type = ["async-unit", "target", "mock"] as const;
	declare readonly properties: TargetAsyncUnitProperties;
	readonly receivedChunks: Array<AudioChunk> = [];
	closed = false;

	get bufferSize(): number {
		return 0;
	}

	get latency(): number {
		return 0;
	}

	async _write(chunk: AudioChunk): Promise<void> {
		this.receivedChunks.push(chunk);
	}

	async _close(): Promise<void> {
		this.closed = true;
	}

	clone(): MockTarget {
		return new MockTarget();
	}
}

function createChunk(value: number, offset: number, duration: number): AudioChunk {
	const samples = new Float32Array(duration).fill(value);
	return { samples: [samples], offset, duration };
}

const testMeta: StreamContext = { sampleRate: 44100, channels: 1 };

describe("AsyncUnit", () => {
	it("type discrimination with is()", () => {
		const source = new MockSource([], testMeta);
		const transform = new MockTransform();
		const target = new MockTarget();

		expect(AsyncUnit.is(source)).toBe(true);
		expect(AsyncUnit.is(transform)).toBe(true);
		expect(AsyncUnit.is(target)).toBe(true);
		expect(AsyncUnit.is({})).toBe(false);
		expect(AsyncUnit.is(null)).toBe(false);

		expect(SourceAsyncUnit.is(source)).toBe(true);
		expect(SourceAsyncUnit.is(transform)).toBe(false);

		expect(TransformAsyncUnit.is(transform)).toBe(true);
		expect(TransformAsyncUnit.is(source)).toBe(false);

		expect(TargetAsyncUnit.is(target)).toBe(true);
		expect(TargetAsyncUnit.is(source)).toBe(false);
	});

	it("to() adds targets", () => {
		const source = new MockSource([], testMeta);
		const target = new MockTarget();

		source.to(target);
		expect(source.targets).toContain(target);
	});

	it("setup() recurses to targets", async () => {
		const source = new MockSource([], testMeta);
		const transform = new MockTransform();
		const target = new MockTarget();

		const sourceSetup = vi.spyOn(source, "_setup" as keyof MockSource);
		const transformSetup = vi.spyOn(transform, "_setup" as keyof MockTransform);
		const targetSetup = vi.spyOn(target, "_setup" as keyof MockTarget);

		source.to(transform);
		transform.to(target);

		await source.setup(testMeta);

		expect(sourceSetup).toHaveBeenCalledWith(testMeta);
		expect(transformSetup).toHaveBeenCalledWith(testMeta);
		expect(targetSetup).toHaveBeenCalledWith(testMeta);
	});

	it("teardown() recurses to targets", async () => {
		const source = new MockSource([], testMeta);
		const transform = new MockTransform();
		const target = new MockTarget();

		const sourceTeardown = vi.spyOn(source, "_teardown" as keyof MockSource);
		const transformTeardown = vi.spyOn(transform, "_teardown" as keyof MockTransform);
		const targetTeardown = vi.spyOn(target, "_teardown" as keyof MockTarget);

		source.to(transform);
		transform.to(target);

		await source.teardown();

		expect(sourceTeardown).toHaveBeenCalled();
		expect(transformTeardown).toHaveBeenCalled();
		expect(targetTeardown).toHaveBeenCalled();
	});

	it("abstract bufferSize and latency must be implemented", () => {
		const source = new MockSource([], testMeta);
		expect(source.bufferSize).toBe(0);
		expect(source.latency).toBe(0);
	});
});

describe("SourceAsyncUnit render", () => {
	it("source → target pipeline flows chunks", async () => {
		const chunks = [
			createChunk(1.0, 0, 100),
			createChunk(0.5, 100, 100),
		];
		const source = new MockSource(chunks, testMeta);
		const target = new MockTarget();

		source.to(target);
		await source.render();

		expect(target.receivedChunks).toHaveLength(2);
		expect(target.receivedChunks[0]?.samples[0]?.[0]).toBe(1.0);
		expect(target.receivedChunks[1]?.samples[0]?.[0]).toBe(0.5);
		expect(target.closed).toBe(true);
	});

	it("source → transform → target pipeline flows chunks", async () => {
		const chunks = [createChunk(1.0, 0, 100)];
		const source = new MockSource(chunks, testMeta);
		const transform = new MockTransform();
		const target = new MockTarget();

		source.to(transform);
		transform.to(target);
		await source.render();

		expect(transform.processedChunks).toHaveLength(1);
		expect(target.receivedChunks).toHaveLength(1);
		expect(target.closed).toBe(true);
	});

	it("teardown runs on error", async () => {
		const source = new MockSource([createChunk(1.0, 0, 100)], testMeta);
		const target = new MockTarget();
		const teardownSpy = vi.spyOn(source, "_teardown" as keyof MockSource);

		vi.spyOn(target, "_write").mockRejectedValue(new Error("write failed"));

		source.to(target);

		await expect(source.render()).rejects.toThrow("write failed");
		expect(teardownSpy).toHaveBeenCalled();
	});
});
