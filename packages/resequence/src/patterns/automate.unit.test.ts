import { describe, expect, it, vi } from "vitest";
import { ResequenceError } from "../error";
import type { ScheduleContext } from "../rendering/schedule-context";
import { bars } from "../utils/duration";
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
		fromBeats: 0,
		toBeats: Infinity,
	};
}

describe("AutomatePattern", () => {
	describe("creation", () => {
		it("creates with name and single path", () => {
			const auto = automate("filter-sweep", "bass.hp.frequency", [
				{ time: 0, value: 80 },
				{ time: 4, value: 2000, curve: "linear" },
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

	describe("durationBeats", () => {
		it("derives from last envelope point", () => {
			const auto = automate("sweep", "bass.hp.frequency", [
				{ time: 0, value: 80 },
				{ time: 4, value: 2000 },
				{ time: bars(2), value: 80 },
			]);
			expect(auto.durationBeats).toBe(bars(2));
		});

		it("rejects empty envelope", () => {
			expect(() => automate("empty", "bass.hp.frequency", [])).toThrow(ResequenceError);
			expect(() => automate("empty", "bass.hp.frequency", [])).toThrow("keyframes array must not be empty");
		});
	});

	describe("envelope resolution", () => {
		it("resolves Duration strings to beats", () => {
			const auto = automate("test", "bass.vol.level", [{ time: "4n", value: 0.5 }]);
			expect(auto.envelope[0].timeBeats).toBe(1);
		});

		it("resolves bars() to beats", () => {
			const auto = automate("test", "bass.vol.level", [
				{ time: 2, value: 0.5 },
				{ time: bars(1), value: 1.0 },
			]);
			expect(auto.envelope[0].timeBeats).toBe(2);
			expect(auto.envelope[1].timeBeats).toBe(4);
		});

		it("passes raw numbers through as beats", () => {
			const auto = automate("test", "bass.vol.level", [{ time: 100, value: 0.5 }]);
			expect(auto.envelope[0].timeBeats).toBe(100);
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

		it("rejects tempo path", () => {
			expect(() => automate("tempo", ["tempo"], [{ time: 0, value: 120 }])).toThrow(ResequenceError);
			expect(() => automate("tempo", ["tempo"], [{ time: 0, value: 120 }])).toThrow("Use tempo() with keyframes instead");
		});

		it("rejects tempo among other paths", () => {
			expect(() => automate("mixed", ["bass.hp.frequency", "tempo"], [{ time: 0, value: 0 }])).toThrow(ResequenceError);
		});
	});

	describe("composition", () => {
		it("composes with layer alongside musical content", () => {
			const auto = automate("sweep", "bass.hp.frequency", [
				{ time: 0, value: 80 },
				{ time: "4n", value: 2000 },
			]);
			const combined = layer(note("C4", "4n"), auto);
			expect(combined.durationBeats).toBe(1);
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

		it("durationBeats is 0 for Lfo source", () => {
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			expect(auto.durationBeats).toBe(0);
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
		it("sets initial value at window start", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const context = { ...mockContext(driverMap), fromBeats: 0, toBeats: 4, tempoMap: [{ beat: 0, bpm: 120 }] };
			const auto = automate("sweep", "bass.hp.frequency", [
				{ time: 0, value: 0.5 },
				{ time: 4, value: 1.0 },
			]);
			auto.setup(context);
			auto.schedule(0, context);
			const driver = driverMap.get("bass.hp.frequency");
			expect(driver?.offset.setValueAtTime).toHaveBeenCalled();
		});

		it("schedules keyframes within window", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const context = { ...mockContext(driverMap), fromBeats: 0, toBeats: 8, tempoMap: [{ beat: 0, bpm: 120 }] };
			const auto = automate("sweep", "bass.hp.frequency", [
				{ time: 0, value: 0.5 },
				{ time: 2, value: 0.8, curve: "linear" as const },
				{ time: 4, value: 1.0 },
			]);
			auto.setup(context);
			auto.schedule(0, context);
			const driver = driverMap.get("bass.hp.frequency");
			expect(driver?.offset.setValueAtTime).toHaveBeenCalled();
			expect(driver?.offset.linearRampToValueAtTime).toHaveBeenCalled();
		});

		it("skips scheduling outside window", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const context = { ...mockContext(driverMap), fromBeats: 10, toBeats: 20, tempoMap: [{ beat: 0, bpm: 120 }] };
			const auto = automate("sweep", "bass.hp.frequency", [
				{ time: 0, value: 0.5 },
				{ time: 4, value: 1.0 },
			]);
			auto.setup(context);
			auto.schedule(0, context);
			const driver = driverMap.get("bass.hp.frequency");
			expect(driver?.offset.setValueAtTime).not.toHaveBeenCalled();
		});

		it("does not set driver offset directly for LFO source", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const context = { ...mockContext(driverMap), fromBeats: 0, toBeats: 8, tempoMap: [{ beat: 0, bpm: 120 }] };
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			auto.setup(context);
			auto.schedule(0, context);
			const driver = driverMap.get("bass.hp.frequency");
			expect(driver?.offset.setValueAtTime).not.toHaveBeenCalled();
		});
	});

	describe("LFO scheduling", () => {
		it("creates oscillator and gain node per path", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const context = { ...mockContext(driverMap), fromBeats: 0, toBeats: 8, tempoMap: [{ beat: 0, bpm: 120 }] };
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			auto.setup(context);
			auto.schedule(0, context);
			expect(context.audioContext.createOscillator).toHaveBeenCalledOnce();
			expect(context.audioContext.createGain).toHaveBeenCalledOnce();
		});

		it("sets oscillator frequency to LFO frequency", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const oscFreqParam = mockAudioParam();
			const createOscillator = vi.fn(() => ({
				type: "sine",
				frequency: oscFreqParam,
				connect: vi.fn(),
				start: vi.fn(),
				stop: vi.fn(),
			}));
			const context = {
				...mockContext(driverMap),
				audioContext: { ...mockContext(driverMap).audioContext, createOscillator } as unknown as BaseAudioContext,
				fromBeats: 0,
				toBeats: 8,
				tempoMap: [{ beat: 0, bpm: 120 }],
			};
			const lfo = resolveLfo({ shape: "sine", frequency: 4, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			auto.setup(context);
			auto.schedule(0, context);
			expect(oscFreqParam.value).toBe(4);
		});

		it("sets oscillator shape to LFO shape", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const oscMock = {
				type: "sine" as string,
				frequency: mockAudioParam(),
				connect: vi.fn(),
				start: vi.fn(),
				stop: vi.fn(),
			};
			const createOscillator = vi.fn(() => oscMock);
			const context = {
				...mockContext(driverMap),
				audioContext: { ...mockContext(driverMap).audioContext, createOscillator } as unknown as BaseAudioContext,
				fromBeats: 0,
				toBeats: 8,
				tempoMap: [{ beat: 0, bpm: 120 }],
			};
			const lfo = resolveLfo({ shape: "square", frequency: 2, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			auto.setup(context);
			auto.schedule(0, context);
			expect(oscMock.type).toBe("square");
		});

		it("supports all waveform types", () => {
			for (const shape of ["sine", "square", "sawtooth", "triangle"] as const) {
				const driverMap = new Map<string, ConstantSourceNode>();
				const oscMock = {
					type: "sine" as string,
					frequency: mockAudioParam(),
					connect: vi.fn(),
					start: vi.fn(),
					stop: vi.fn(),
				};
				const createOscillator = vi.fn(() => oscMock);
				const context = {
					...mockContext(driverMap),
					audioContext: { ...mockContext(driverMap).audioContext, createOscillator } as unknown as BaseAudioContext,
					fromBeats: 0,
					toBeats: 8,
					tempoMap: [{ beat: 0, bpm: 120 }],
				};
				const lfo = resolveLfo({ shape, frequency: 2, value: 500 });
				const auto = automate(`lfo-${shape}`, "bass.hp.frequency", lfo);
				auto.setup(context);
				auto.schedule(0, context);
				expect(oscMock.type).toBe(shape);
			}
		});

		it("connects oscillator through depth gain to driver", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const oscConnect = vi.fn();
			const gainConnect = vi.fn();
			const oscMock = {
				type: "sine",
				frequency: mockAudioParam(),
				connect: oscConnect,
				start: vi.fn(),
				stop: vi.fn(),
			};
			const gainMock = { gain: mockAudioParam(), connect: gainConnect };
			const context = {
				...mockContext(driverMap),
				audioContext: {
					...mockContext(driverMap).audioContext,
					createOscillator: vi.fn(() => oscMock),
					createGain: vi.fn(() => gainMock),
				} as unknown as BaseAudioContext,
				fromBeats: 0,
				toBeats: 8,
				tempoMap: [{ beat: 0, bpm: 120 }],
			};
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			auto.setup(context);
			auto.schedule(0, context);
			expect(oscConnect).toHaveBeenCalledWith(gainMock);
			const driver = driverMap.get("bass.hp.frequency");
			expect(gainConnect).toHaveBeenCalledWith(driver?.offset);
		});

		it("sets depth gain to LFO value when no attack", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const gainParam = mockAudioParam();
			const context = {
				...mockContext(driverMap),
				audioContext: {
					...mockContext(driverMap).audioContext,
					createOscillator: vi.fn(() => ({
						type: "sine",
						frequency: mockAudioParam(),
						connect: vi.fn(),
						start: vi.fn(),
						stop: vi.fn(),
					})),
					createGain: vi.fn(() => ({ gain: gainParam, connect: vi.fn() })),
				} as unknown as BaseAudioContext,
				fromBeats: 0,
				toBeats: 8,
				tempoMap: [{ beat: 0, bpm: 120 }],
			};
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			auto.setup(context);
			auto.schedule(0, context);
			expect(gainParam.value).toBe(500);
		});

		it("ramps depth gain when attack is set", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const gainParam = mockAudioParam();
			const context = {
				...mockContext(driverMap),
				audioContext: {
					...mockContext(driverMap).audioContext,
					createOscillator: vi.fn(() => ({
						type: "sine",
						frequency: mockAudioParam(),
						connect: vi.fn(),
						start: vi.fn(),
						stop: vi.fn(),
					})),
					createGain: vi.fn(() => ({ gain: gainParam, connect: vi.fn() })),
				} as unknown as BaseAudioContext,
				fromBeats: 0,
				toBeats: 8,
				tempoMap: [{ beat: 0, bpm: 120 }],
			};
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500, attack: 0.5 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			auto.setup(context);
			auto.schedule(0, context);
			expect(gainParam.setValueAtTime).toHaveBeenCalledWith(0, 0);
			expect(gainParam.linearRampToValueAtTime).toHaveBeenCalledWith(500, 0.5);
		});

		it("starts and stops oscillator within window", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const oscStart = vi.fn();
			const oscStop = vi.fn();
			const context = {
				...mockContext(driverMap),
				audioContext: {
					...mockContext(driverMap).audioContext,
					createOscillator: vi.fn(() => ({
						type: "sine",
						frequency: mockAudioParam(),
						connect: vi.fn(),
						start: oscStart,
						stop: oscStop,
					})),
					createGain: vi.fn(() => ({ gain: mockAudioParam(), connect: vi.fn() })),
				} as unknown as BaseAudioContext,
				fromBeats: 0,
				toBeats: 8,
				tempoMap: [{ beat: 0, bpm: 120 }],
			};
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			auto.setup(context);
			auto.schedule(0, context);
			expect(oscStart).toHaveBeenCalledOnce();
			expect(oscStop).toHaveBeenCalledOnce();
		});

		it("skips scheduling when offset is past window end", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const context = { ...mockContext(driverMap), fromBeats: 0, toBeats: 4, tempoMap: [{ beat: 0, bpm: 120 }] };
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			auto.setup(context);
			auto.schedule(10, context);
			expect(context.audioContext.createOscillator).not.toHaveBeenCalled();
		});

		it("skips scheduling when window ends before delay completes", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const context = { ...mockContext(driverMap), fromBeats: 0, toBeats: 4, tempoMap: [{ beat: 0, bpm: 120 }] };
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500, delay: 10 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			auto.setup(context);
			auto.schedule(0, context);
			expect(context.audioContext.createOscillator).not.toHaveBeenCalled();
		});

		it("creates oscillator per path for multi-path LFO", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const createOscillator = vi.fn(() => ({
				type: "sine",
				frequency: mockAudioParam(),
				connect: vi.fn(),
				start: vi.fn(),
				stop: vi.fn(),
			}));
			const context = {
				...mockContext(driverMap),
				audioContext: {
					...mockContext(driverMap).audioContext,
					createOscillator,
					createGain: vi.fn(() => ({ gain: mockAudioParam(), connect: vi.fn() })),
				} as unknown as BaseAudioContext,
				fromBeats: 0,
				toBeats: 8,
				tempoMap: [{ beat: 0, bpm: 120 }],
			};
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500 });
			const auto = automate("filter-lfo", ["bass.hp.frequency", "pad.hp.frequency"], lfo);
			auto.setup(context);
			auto.schedule(0, context);
			expect(createOscillator).toHaveBeenCalledTimes(2);
		});

		it("computes beat-rate frequency from tempo", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const oscFreqParam = mockAudioParam();
			const createOscillator = vi.fn(() => ({
				type: "sine",
				frequency: oscFreqParam,
				connect: vi.fn(),
				start: vi.fn(),
				stop: vi.fn(),
			}));
			const context = {
				...mockContext(driverMap),
				audioContext: {
					...mockContext(driverMap).audioContext,
					createOscillator,
					createGain: vi.fn(() => ({ gain: mockAudioParam(), connect: vi.fn() })),
				} as unknown as BaseAudioContext,
				fromBeats: 0,
				toBeats: 8,
				tempoMap: [{ beat: 0, bpm: 120 }],
			};
			const lfo = resolveLfo({ shape: "sine", frequency: "4n", value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			auto.setup(context);
			auto.schedule(0, context);
			expect(oscFreqParam.value).toBe(2);
		});

		it("schedules frequency updates at tempo changes for beat-rate LFO", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const oscFreqParam = mockAudioParam();
			const createOscillator = vi.fn(() => ({
				type: "sine",
				frequency: oscFreqParam,
				connect: vi.fn(),
				start: vi.fn(),
				stop: vi.fn(),
			}));
			const context = {
				...mockContext(driverMap),
				audioContext: {
					...mockContext(driverMap).audioContext,
					createOscillator,
					createGain: vi.fn(() => ({ gain: mockAudioParam(), connect: vi.fn() })),
				} as unknown as BaseAudioContext,
				fromBeats: 0,
				toBeats: 16,
				tempoMap: [{ beat: 0, bpm: 120 }, { beat: 8, bpm: 60 }],
			};
			const lfo = resolveLfo({ shape: "sine", frequency: "4n", value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			auto.setup(context);
			auto.schedule(0, context);
			expect(oscFreqParam.setValueAtTime).toHaveBeenCalledWith(1, expect.any(Number));
		});

		it("does not schedule frequency updates for Hz-based LFO", () => {
			const driverMap = new Map<string, ConstantSourceNode>();
			const oscFreqParam = mockAudioParam();
			const createOscillator = vi.fn(() => ({
				type: "sine",
				frequency: oscFreqParam,
				connect: vi.fn(),
				start: vi.fn(),
				stop: vi.fn(),
			}));
			const context = {
				...mockContext(driverMap),
				audioContext: {
					...mockContext(driverMap).audioContext,
					createOscillator,
					createGain: vi.fn(() => ({ gain: mockAudioParam(), connect: vi.fn() })),
				} as unknown as BaseAudioContext,
				fromBeats: 0,
				toBeats: 16,
				tempoMap: [{ beat: 0, bpm: 120 }, { beat: 8, bpm: 60 }],
			};
			const lfo = resolveLfo({ shape: "sine", frequency: 4, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			auto.setup(context);
			auto.schedule(0, context);
			expect(oscFreqParam.setValueAtTime).not.toHaveBeenCalled();
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
