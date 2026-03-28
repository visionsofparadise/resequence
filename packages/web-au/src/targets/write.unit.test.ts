import { describe, expect, it, vi } from "vitest";
import type { UnitContext } from "@resequence/web-au-core";
import { WriteUnit, write } from "./write";

vi.mock("node:fs", () => ({
	mkdirSync: vi.fn(),
	writeFileSync: vi.fn(),
}));

function mockAudioBuffer(): AudioBuffer {
	const channel = new Float32Array(100);
	return {
		numberOfChannels: 1,
		sampleRate: 44100,
		length: 100,
		duration: 100 / 44100,
		getChannelData: () => channel,
	} as unknown as AudioBuffer;
}

function mockContext(offline: boolean) {
	const gainNode = { connect: vi.fn(), disconnect: vi.fn() } as unknown as GainNode;
	const destination = {} as AudioDestinationNode;

	const audioContext = {
		createGain: () => gainNode,
		destination,
		...(offline ? { startRendering: vi.fn().mockResolvedValue(mockAudioBuffer()) } : {}),
	} as unknown as BaseAudioContext;

	return {
		context: {
			audioContext,
			driverMap: new Map(),
			getSample: () => Promise.resolve({} as AudioBuffer),
			loadModule: () => Promise.resolve(),
			latencyBudget: 0,
			basePath: "/tmp",
		} as UnitContext,
		gainNode,
		destination,
		audioContext,
	};
}

describe("WriteUnit", () => {
	it("is identifiable via static is()", () => {
		const unit = write({ path: "out.wav" });
		expect(WriteUnit.is(unit)).toBe(true);
	});

	it("has correct type discriminator", () => {
		const unit = write({ path: "out.wav" });
		expect(unit.type).toEqual(["unit", "target", "write"]);
	});

	it("stores path and bitDepth properties", () => {
		const unit = write({ path: "out.wav", bitDepth: "16" });
		expect(unit.path).toBe("out.wav");
		expect(unit.bitDepth).toBe("16");
	});

	it("defaults bitDepth to 24", () => {
		const unit = write({ path: "out.wav" });
		expect(unit.bitDepth).toBe("24");
	});

	it("connects to destination on OfflineAudioContext", async () => {
		const { context, gainNode, destination } = mockContext(true);
		const unit = write({ path: "out.wav" });

		await unit.setup(context);

		expect(unit.entryNodes).toHaveLength(1);
		expect(unit.exitNodes).toHaveLength(1);
		expect(gainNode.connect).toHaveBeenCalledWith(destination);
	});

	it("does not connect to destination on live AudioContext", async () => {
		const { context, gainNode } = mockContext(false);
		const unit = write({ path: "out.wav" });

		await unit.setup(context);

		expect(unit.entryNodes).toHaveLength(1);
		expect(unit.exitNodes).toHaveLength(1);
		expect(gainNode.connect).not.toHaveBeenCalled();
	});

	it("render() renders and writes file on offline context", async () => {
		const { context } = mockContext(true);
		const unit = write({ path: "out.wav" });

		await unit.setup(context);
		await unit.render(context);

		const { mkdirSync, writeFileSync } = await import("node:fs");
		expect(mkdirSync).toHaveBeenCalled();
		expect(writeFileSync).toHaveBeenCalled();
	});

	it("render() is a no-op on live context", async () => {
		const { context } = mockContext(false);
		const unit = write({ path: "out.wav" });

		await unit.setup(context);

		vi.clearAllMocks();
		await unit.render(context);

		const { writeFileSync } = await import("node:fs");
		expect(writeFileSync).not.toHaveBeenCalled();
	});

	it("clones correctly", () => {
		const unit = write({ path: "out.wav", bitDepth: "32" });
		const cloned = unit.clone();

		expect(cloned).toBeInstanceOf(WriteUnit);
		expect(cloned.path).toBe("out.wav");
		expect(cloned.bitDepth).toBe("32");
	});
});
