import { describe, expect, it, vi } from "vitest";
import type { UnitContext } from "@resequence/web-au-core";
import { read } from "./read";

function mockContext() {
	const gainNode = { connect: vi.fn(), disconnect: vi.fn() } as unknown as GainNode;
	const sourceNode = {
		connect: vi.fn(),
		start: vi.fn(),
		buffer: null as AudioBuffer | null,
	} as unknown as AudioBufferSourceNode;
	const mockBuffer = { duration: 2.5 } as AudioBuffer;

	const audioContext = {
		createGain: () => gainNode,
		createBufferSource: () => sourceNode,
		sampleRate: 44100,
	} as unknown as BaseAudioContext;

	return {
		context: {
			audioContext,
			driverMap: new Map(),
			getSample: vi.fn().mockResolvedValue(mockBuffer),
			loadModule: () => Promise.resolve(),
			latencyBudget: 0,
			basePath: ".",
		} as UnitContext,
		gainNode,
		sourceNode,
		mockBuffer,
	};
}

describe("ReadUnit", () => {
	it("has correct packageName and unitName", () => {
		const unit = read({ path: "input.wav" });
		expect(unit.packageName).toBe("@resequence/web-au");
		expect(unit.unitName).toBe("read");
	});

	it("has correct type tuple", () => {
		const unit = read({ path: "input.wav" });
		expect(unit.type).toEqual(["unit"]);
	});

	it("stores path property", () => {
		const unit = read({ path: "input.wav" });
		expect(unit.path).toBe("input.wav");
	});

	it("loads audio during setup", async () => {
		const { context, sourceNode, mockBuffer } = mockContext();
		const unit = read({ path: "input.wav" });

		await unit.setup(context);

		expect(context.getSample).toHaveBeenCalledWith("input.wav");
		expect(sourceNode.buffer).toBe(mockBuffer);
		expect(sourceNode.connect).toHaveBeenCalled();
		expect(unit.entryNodes).toHaveLength(1);
		expect(unit.exitNodes).toHaveLength(1);
	});

	it("start() starts the buffer source", async () => {
		const { context, sourceNode } = mockContext();
		const unit = read({ path: "input.wav" });

		await unit.setup(context);
		await unit.start(context);

		expect(sourceNode.start).toHaveBeenCalledWith(0);
	});

	it("start() starts with latency offset", async () => {
		const { context, sourceNode } = mockContext();
		(context as { latencyBudget: number }).latencyBudget = 4410;
		const unit = read({ path: "input.wav" });

		await unit.setup(context);
		await unit.start(context);

		expect(sourceNode.start).toHaveBeenCalledWith(0.1);
	});

	it("start() is a no-op before setup", async () => {
		const { context } = mockContext();
		const unit = read({ path: "input.wav" });
		// Should not throw
		await unit.start(context);
	});

	it("exposes duration after setup", async () => {
		const { context } = mockContext();
		const unit = read({ path: "input.wav" });

		expect(unit.duration).toBe(0);

		await unit.setup(context);

		expect(unit.duration).toBe(2.5);
	});
});
