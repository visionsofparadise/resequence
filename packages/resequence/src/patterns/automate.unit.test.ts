import { describe, expect, it, vi } from "vitest";
import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import { bars, beats } from "../utils/duration";
import { resolveLfo } from "../utils/lfo";
import { automate } from "./automate";
import { layer } from "./layer";
import { note } from "./note";

function mockAudioParam(): AudioParam {
	return {
		setValueAtTime: vi.fn(),
		linearRampToValueAtTime: vi.fn(),
		exponentialRampToValueAtTime: vi.fn(),
		value: 0,
	} as unknown as AudioParam;
}

function mockConstantSource(): ConstantSourceNode {
	return {
		offset: mockAudioParam(),
		start: vi.fn(),
		stop: vi.fn(),
		disconnect: vi.fn(),
		connect: vi.fn(),
	} as unknown as ConstantSourceNode;
}

function mockContext(driverMap = new Map<string, ConstantSourceNode>()): ScheduleContext {
	const constant = mockConstantSource();

	return {
		audioContext: {
			createConstantSource: vi.fn(() => constant),
			createOscillator: vi.fn(() => ({
				type: "sine",
				frequency: mockAudioParam(),
				connect: vi.fn(),
				start: vi.fn(),
				stop: vi.fn(),
			})),
			createGain: vi.fn(() => ({
				gain: mockAudioParam(),
				connect: vi.fn(),
			})),
		} as unknown as BaseAudioContext,
		sampleMap: new Map(),
		nodeMap: new Map(),
		driverMap,
		tempo: 120,
		fromTicks: 0,
		toTicks: Infinity,
	};
}

describe("AutomatePattern", () => {
	describe("creation", () => {
		it("creates with name and single path", () => {
			const auto = automate("filter-sweep", "bass.hp.frequency", [
				{ time: 0, value: 80 },
				{ time: beats(4), value: 2000, curve: "linear" },
			]);
			expect(auto.type).toBe("automate");
			expect(auto.name).toBe("filter-sweep");
			expect(auto.paths).toEqual(["bass.hp.frequency"]);
		});

		it("creates with multi-path", () => {
			const auto = automate(
				"dual-filter",
				["bass.hp.frequency", "pad.hp.frequency"],
				[
					{ time: 0, value: 80 },
					{ time: bars(4), value: 2000, curve: "linear" },
				],
			);
			expect(auto.paths).toEqual(["bass.hp.frequency", "pad.hp.frequency"]);
		});
	});

	describe("durationTicks", () => {
		it("derives from last envelope point", () => {
			const auto = automate("sweep", "bass.hp.frequency", [
				{ time: 0, value: 80 },
				{ time: beats(4), value: 2000 },
				{ time: bars(2), value: 80 },
			]);
			expect(auto.durationTicks).toBe(bars(2));
		});

		it("rejects empty envelope", () => {
			expect(() => automate("empty", "bass.hp.frequency", [])).toThrow(ResequenceError);
			expect(() => automate("empty", "bass.hp.frequency", [])).toThrow("keyframes array must not be empty");
		});
	});

	describe("envelope resolution", () => {
		it("resolves Duration strings to ticks", () => {
			const auto = automate("test", "bass.vol.level", [{ time: "4n", value: 0.5 }]);
			expect(auto.envelope[0].timeTicks).toBe(480);
		});

		it("resolves bars() and beats() to ticks", () => {
			const auto = automate("test", "bass.vol.level", [
				{ time: beats(2), value: 0.5 },
				{ time: bars(1), value: 1.0 },
			]);
			expect(auto.envelope[0].timeTicks).toBe(960);
			expect(auto.envelope[1].timeTicks).toBe(1920);
		});

		it("passes raw tick numbers through", () => {
			const auto = automate("test", "bass.vol.level", [{ time: 100, value: 0.5 }]);
			expect(auto.envelope[0].timeTicks).toBe(100);
		});

		it("preserves curve types", () => {
			const auto = automate("test", "bass.vol.level", [
				{ time: 0, value: 0, curve: "step" },
				{ time: "4n", value: 1, curve: "linear" },
				{ time: "2n", value: 0, curve: "exponential" },
			]);
			expect(auto.envelope[0].curve).toBe("step");
			expect(auto.envelope[1].curve).toBe("linear");
			expect(auto.envelope[2].curve).toBe("exponential");
		});
	});

	describe("path validation", () => {
		it("rejects paths with fewer than 2 segments", () => {
			expect(() => automate("bad", "bass", [{ time: 0, value: 0 }])).toThrow();
		});

		it("accepts 2-segment paths", () => {
			expect(() => automate("ok", "bass.hp", [{ time: 0, value: 0 }])).not.toThrow();
		});

		it("accepts 3-segment paths", () => {
			expect(() => automate("ok", "bass.hp.frequency", [{ time: 0, value: 0 }])).not.toThrow();
		});
	});

	describe("composition", () => {
		it("composes with layer alongside musical content", () => {
			const auto = automate("sweep", "bass.hp.frequency", [
				{ time: 0, value: 80 },
				{ time: "4n", value: 2000 },
			]);
			const combined = layer(note("C4", "4n"), auto);
			expect(combined.durationTicks).toBe(480);
		});
	});

	describe("notes", () => {
		it("returns empty", () => {
			expect(automate("test", "bass.hp.frequency", [{ time: 0, value: 0.5 }]).notes).toEqual([]);
		});
	});

	describe("Lfo source", () => {
		it("creates with Lfo source", () => {
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			expect(auto.source).toBe(lfo);
		});

		it("durationTicks is 0 for Lfo source", () => {
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			expect(auto.durationTicks).toBe(0);
		});

		it("envelope getter returns empty for Lfo source", () => {
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			expect(auto.envelope).toEqual([]);
		});
	});

	describe("setup", () => {
		it("creates ConstantSourceNode per path for keyframe source", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const context = mockContext(driverMap);
			const auto = automate("sweep", "bass.hp.frequency", [{ time: 0, value: 80 }]);
			auto.setup(context);
			expect(context.audioContext.createConstantSource).toHaveBeenCalledOnce();
			expect(driverMap.has("bass.hp.frequency")).toBe(true);
		});

		it("creates ConstantSourceNode per path for Lfo source", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const context = mockContext(driverMap);
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			auto.setup(context);
			expect(driverMap.has("bass.hp.frequency")).toBe(true);
		});

		it("creates one ConstantSourceNode per path for multi-path", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const createConstantSource = vi.fn(() => mockConstantSource());
			const context: ScheduleContext = {
				...mockContext(driverMap),
				audioContext: { ...mockContext(driverMap).audioContext, createConstantSource } as unknown as BaseAudioContext,
			};
			const auto = automate("sweep", ["bass.hp.frequency", "pad.hp.frequency"], [{ time: 0, value: 80 }]);
			auto.setup(context);
			expect(createConstantSource).toHaveBeenCalledTimes(2);
			expect(driverMap.has("bass.hp.frequency")).toBe(true);
			expect(driverMap.has("pad.hp.frequency")).toBe(true);
		});

		it("starts ConstantSourceNode", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const context = mockContext(driverMap);
			const auto = automate("sweep", "bass.hp.frequency", [{ time: 0, value: 80 }]);
			auto.setup(context);
			const node = driverMap.get("bass.hp.frequency");
			expect(node?.start).toHaveBeenCalledWith(0);
		});
	});

	describe("schedule", () => {
		it("is a no-op", () => {
			const context = mockContext();
			const auto = automate("sweep", "bass.hp.frequency", [{ time: 0, value: 80 }]);
			expect(() => auto.schedule(0, context)).not.toThrow();
		});
	});

	describe("teardown", () => {
		it("stops and disconnects ConstantSourceNode", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const context = mockContext(driverMap);
			const auto = automate("sweep", "bass.hp.frequency", [{ time: 0, value: 80 }]);
			auto.setup(context);
			const node = driverMap.get("bass.hp.frequency");
			auto.teardown(context);
			expect(node?.stop).toHaveBeenCalled();
			expect(node?.disconnect).toHaveBeenCalled();
			expect(driverMap.has("bass.hp.frequency")).toBe(false);
		});
	});
});
