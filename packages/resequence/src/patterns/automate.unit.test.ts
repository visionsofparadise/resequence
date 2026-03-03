import { describe, expect, it, vi } from "vitest";
import { ResequenceError } from "../error";
import type { DriverEntry, ScheduleContext } from "../rendering/schedule-context";
import { bars } from "../utils/duration";
import { resolveLfo } from "../utils/lfo";
import { automate } from "./automate";

function mockAudioParam(): AudioParam {
	return {
		setValueAtTime: vi.fn(),
		linearRampToValueAtTime: vi.fn(),
		exponentialRampToValueAtTime: vi.fn(),
		setValueCurveAtTime: vi.fn(),
		value: 0,
	} as unknown as AudioParam;
}

function mockDriverEntry(): DriverEntry {
	return {
		node: {
			offset: mockAudioParam(),
			start: vi.fn(),
			stop: vi.fn(),
			disconnect: vi.fn(),
			connect: vi.fn(),
		} as unknown as ConstantSourceNode,
		range: [0, 1],
	};
}

function mockContext(driverMap = new Map<string, DriverEntry>()): ScheduleContext {
	return {
		audioContext: {
			createConstantSource: vi.fn(() => ({
				offset: mockAudioParam(),
				start: vi.fn(),
				stop: vi.fn(),
				disconnect: vi.fn(),
				connect: vi.fn(),
			})),
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
		driverMap,
		tempoMap: [{ beat: 0, bpm: 120 }],
		fromBeats: 0,
		toBeats: Infinity,
		outputs: [],
		dispatch: vi.fn(),
	};
}

describe("AutomatePattern", () => {
	describe("creation", () => {
		it("creates with name and single path", () => {
			const auto = automate("filter-sweep", "bass.hp.frequency", [
				{ beat: 0, value: 0.5 },
				{ beat: 4, value: 1.0 },
			]);
			expect(auto).toBeInstanceOf(auto.constructor);
			expect(auto.properties.name).toBe("filter-sweep");
			expect(auto.properties.paths).toEqual(["bass.hp.frequency"]);
		});
	});

	describe("durationBeats", () => {
		it("derives from last envelope point", () => {
			const auto = automate("sweep", "bass.hp.frequency", [
				{ beat: 0, value: 0.5 },
				{ beat: 4, value: 1.0 },
				{ beat: bars(2), value: 0.5 },
			]);
			expect(auto.endBeat - auto.startBeat).toBe(bars(2));
		});

		it("rejects empty envelope", () => {
			expect(() => automate("empty", "bass.hp.frequency", [])).toThrow(ResequenceError);
			expect(() => automate("empty", "bass.hp.frequency", [])).toThrow("keyframes array must not be empty");
		});
	});

	describe("path validation", () => {
		it("rejects paths with fewer than 2 segments", () => {
			expect(() => automate("bad", "bass", [{ beat: 0, value: 0 }])).toThrow();
		});

		it("rejects tempo path", () => {
			expect(() => automate("tempo", ["tempo"], [{ beat: 0, value: 0.5 }])).toThrow(ResequenceError);
			expect(() => automate("tempo", ["tempo"], [{ beat: 0, value: 0.5 }])).toThrow("Use tempo() with keyframes instead");
		});
	});

	describe("Lfo source", () => {
		it("durationBeats is 0 for Lfo source", () => {
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			expect(auto.endBeat - auto.startBeat).toBe(0);
		});

		it("source is Lfo for Lfo source", () => {
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			expect(Array.isArray(auto.properties.source)).toBe(false);
		});
	});

	describe("schedule", () => {
		it("skips scheduling outside window", () => {
			const entry = mockDriverEntry();
			const driverMap = new Map<string, DriverEntry>([["bass.hp.frequency", entry]]);
			const context = { ...mockContext(driverMap), fromBeats: 10, toBeats: 20, tempoMap: [{ beat: 0, bpm: 120 }] };
			const auto = automate("sweep", "bass.hp.frequency", [
				{ beat: 0, value: 0.5 },
				{ beat: 4, value: 1.0 },
			]);
			auto.schedule(0, context);
			expect(entry.node.offset.setValueAtTime).not.toHaveBeenCalled();
		});

		it("does not set driver offset directly for LFO source", () => {
			const entry = mockDriverEntry();
			const driverMap = new Map<string, DriverEntry>([["bass.hp.frequency", entry]]);
			const context = { ...mockContext(driverMap), fromBeats: 0, toBeats: 8, tempoMap: [{ beat: 0, bpm: 120 }] };
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			auto.schedule(0, context);
			expect(entry.node.offset.setValueAtTime).not.toHaveBeenCalled();
		});
	});

	describe("LFO scheduling", () => {
		it("ramps depth gain when attack is set", () => {
			const entry = mockDriverEntry();
			const driverMap = new Map<string, DriverEntry>([["bass.hp.frequency", entry]]);
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
			auto.schedule(0, context);
			expect(gainParam.setValueAtTime).toHaveBeenCalledWith(0, 0);
			expect(gainParam.linearRampToValueAtTime).toHaveBeenCalledWith(500, 0.5);
		});

		it("skips scheduling when window ends before delay completes", () => {
			const entry = mockDriverEntry();
			const driverMap = new Map<string, DriverEntry>([["bass.hp.frequency", entry]]);
			const context = { ...mockContext(driverMap), fromBeats: 0, toBeats: 4, tempoMap: [{ beat: 0, bpm: 120 }] };
			const lfo = resolveLfo({ shape: "sine", frequency: 2, value: 500, delay: 10 });
			const auto = automate("filter-lfo", "bass.hp.frequency", lfo);
			auto.schedule(0, context);
			expect(context.audioContext.createOscillator).not.toHaveBeenCalled();
		});
	});
});
