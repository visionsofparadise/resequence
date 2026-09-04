import { describe, expect, it, vi } from "vitest";
import type { UnitContext } from "@resequence/web-au-core";
import { speakers } from "./speakers";

function mockContext(offline: boolean) {
	const gainNode = { connect: vi.fn(), disconnect: vi.fn() } as unknown as GainNode;
	const destination = {} as AudioDestinationNode;

	const audioContext = {
		createGain: () => gainNode,
		destination,
		...(offline ? { startRendering: vi.fn() } : {}),
	} as unknown as BaseAudioContext;

	return {
		context: {
			audioContext,
			driverMap: new Map(),
			getSample: () => Promise.resolve({} as AudioBuffer),
			loadModule: () => Promise.resolve(),
		} as UnitContext,
		gainNode,
		destination,
	};
}

describe("SpeakersUnit", () => {
	it("has correct packageName and unitName", () => {
		const unit = speakers();
		expect(unit.packageName).toBe("@resequence/web-au");
		expect(unit.unitName).toBe("speakers");
	});

	it("has correct type tuple", () => {
		const unit = speakers();
		expect(unit.type).toEqual(["unit"]);
	});

	it("connects to destination on live AudioContext", async () => {
		const { context, gainNode, destination } = mockContext(false);
		const unit = speakers();

		await unit.setup(context);

		expect(unit.entryNodes).toHaveLength(1);
		expect(unit.exitNodes).toHaveLength(1);
		expect(gainNode.connect).toHaveBeenCalledWith(destination);
	});

	it("does not connect to destination on OfflineAudioContext", async () => {
		const { context, gainNode } = mockContext(true);
		const unit = speakers();

		await unit.setup(context);

		expect(unit.entryNodes).toHaveLength(1);
		expect(unit.exitNodes).toHaveLength(1);
		expect(gainNode.connect).not.toHaveBeenCalled();
	});
});
