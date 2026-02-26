import { describe, expect, it } from "vitest";
import { ResequenceError } from "../../error";
import { gain } from "../effects/gain";
import { SamplerUnit, sampler } from "./sampler";

describe("sampler", () => {
	describe("validation", () => {
		it("rejects empty zones array", () => {
			expect(() => sampler([])).toThrow(ResequenceError);
			expect(() => sampler([])).toThrow("zones array must not be empty");
		});

		it("rejects empty mapping", () => {
			expect(() => sampler({})).toThrow(ResequenceError);
			expect(() => sampler({})).toThrow("mapping must not be empty");
		});
	});

	describe("single sample", () => {
		it("creates SamplerUnit with id", () => {
			const node = sampler("./bass.wav", { id: "bass" });
			expect(node).toBeInstanceOf(SamplerUnit);
			expect(node.id).toBe("bass");
		});

		it("accepts root for pitch shifting", () => {
			const node = sampler("./bass-C2.wav", { root: "C2", id: "bass" });
			expect(node).toBeInstanceOf(SamplerUnit);
		});

		it("accepts loop points", () => {
			const node = sampler("./pad.wav", { root: "C3", loopStartMs: 500, loopEndMs: 1200, id: "pad" });
			expect(node).toBeInstanceOf(SamplerUnit);
		});
	});

	describe("mapping", () => {
		it("creates SamplerUnit from note mapping", () => {
			const node = sampler({ C1: "./kick.wav", D1: "./snare.wav" }, { id: "drums" });
			expect(node).toBeInstanceOf(SamplerUnit);
			expect(node.id).toBe("drums");
		});

		it("supports velocity layers in mapping", () => {
			const node = sampler({
				C1: [
					{ sample: "./kick-soft.wav", velocity: 0 },
					{ sample: "./kick-hard.wav", velocity: 64 },
				],
			});
			expect(node).toBeInstanceOf(SamplerUnit);
		});
	});

	describe("zones", () => {
		it("creates SamplerUnit from zones array", () => {
			const node = sampler([
				{ sample: "./piano-C3.wav", root: "C3" },
				{ sample: "./piano-C4.wav", root: "C4" },
			], { id: "piano" });
			expect(node).toBeInstanceOf(SamplerUnit);
		});

		it("accepts zones without root (no pitch shift)", () => {
			const node = sampler([
				{ sample: "./slice1.wav", velocity: 0 },
				{ sample: "./slice2.wav", velocity: 64 },
			]);
			expect(node).toBeInstanceOf(SamplerUnit);
		});
	});

	describe("region normalization", () => {
		it("normalizes zone region to composite key when sample has no #", () => {
			const node = sampler([
				{ sample: "./piano-all.wav", region: "C4-soft", root: "C4" },
			]);
			const config = (node as unknown as { config: { zones: Array<{ sample: string }> } }).config;
			expect(config.zones[0]?.sample).toBe("./piano-all.wav#C4-soft");
		});

		it("does not duplicate # when sample already contains it", () => {
			const node = sampler([
				{ sample: "./piano-all.wav#C4-soft", region: "C4-soft", root: "C4" },
			]);
			const config = (node as unknown as { config: { zones: Array<{ sample: string }> } }).config;
			expect(config.zones[0]?.sample).toBe("./piano-all.wav#C4-soft");
		});

		it("preserves sample as-is when no region property", () => {
			const node = sampler([{ sample: "./piano-C4.wav", root: "C4" }]);
			const config = (node as unknown as { config: { zones: Array<{ sample: string }> } }).config;
			expect(config.zones[0]?.sample).toBe("./piano-C4.wav");
		});
	});

	describe("zone resolution: pitch + velocity", () => {
		it("selects by pitch then velocity simultaneously", () => {
			const node = sampler([
				{ sample: "./piano-C4-soft.wav", root: "C4", velocity: 0 },
				{ sample: "./piano-C4-hard.wav", root: "C4", velocity: 64 },
				{ sample: "./piano-C5-soft.wav", root: "C5", velocity: 0 },
				{ sample: "./piano-C5-hard.wav", root: "C5", velocity: 64 },
			]);

			const c4Soft = { id: "c4-soft" } as unknown as AudioBuffer;
			const c4Hard = { id: "c4-hard" } as unknown as AudioBuffer;
			const c5Soft = { id: "c5-soft" } as unknown as AudioBuffer;
			const c5Hard = { id: "c5-hard" } as unknown as AudioBuffer;

			const sampleMap = new Map<string, AudioBuffer>([
				["./piano-C4-soft.wav", c4Soft],
				["./piano-C4-hard.wav", c4Hard],
				["./piano-C5-soft.wav", c5Soft],
				["./piano-C5-hard.wav", c5Hard],
			]);

			let assignedBuffer: AudioBuffer | null = null;
			const mockSourceNode = {
				get buffer() { return assignedBuffer; },
				set buffer(v: AudioBuffer | null) { assignedBuffer = v; },
				playbackRate: { value: 1 },
				loop: false, loopStart: 0, loopEnd: 0,
				start: () => undefined, stop: () => undefined,
				connect: (dest: unknown) => dest,
				disconnect: () => undefined,
				addEventListener: () => undefined,
			};

			const mockGainNode = { gain: { value: 1, setValueAtTime: () => undefined, linearRampToValueAtTime: () => undefined }, connect: () => undefined, disconnect: () => undefined };
			const mockConstantSourceNode = { offset: { value: 1, setValueAtTime: () => undefined, cancelScheduledValues: () => undefined, linearRampToValueAtTime: () => undefined }, connect: () => undefined, start: () => undefined };
			const mockContext = {
				audioContext: { createBufferSource: () => mockSourceNode, createGain: () => mockGainNode, createConstantSource: () => mockConstantSourceNode, destination: {} },
				sampleMap,
				driverMap: new Map(),
				tempoMap: [],
				fromBeats: 0,
				toBeats: Infinity,
			} as unknown as import("../../rendering/schedule-context").ScheduleContext;

			const c4Midi = 60;

			node.schedule({ note: c4Midi, bend: 0, velocity: 30, startMs: 0, stopMs: 1000, cleanupMs: 1500 } as import("../midi-unit").VoiceNote, mockContext);
			expect(assignedBuffer).toBe(c4Soft);

			assignedBuffer = null;
			node.schedule({ note: c4Midi, bend: 0, velocity: 100, startMs: 0, stopMs: 1000, cleanupMs: 1500 } as import("../midi-unit").VoiceNote, mockContext);
			expect(assignedBuffer).toBe(c4Hard);
		});
	});

	describe(".to()", () => {
		it("returns the connected downstream node", () => {
			const node = sampler("./bass.wav", { id: "bass" });
			const gainNode = gain({ level: -3 });
			const chained = node.to(gainNode);
			expect(chained).toBe(gainNode);
		});

		it("appends to targets of the source node", () => {
			const node = sampler("./bass.wav", { id: "bass" });
			node.to(gain({ level: -3 }));
			expect(node.targets).toHaveLength(1);
		});
	});
});
