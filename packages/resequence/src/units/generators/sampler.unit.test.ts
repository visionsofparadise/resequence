import { N } from "../../tunings/chromatic";
import { describe, expect, it } from "vitest";
import { ResequenceError } from "../../error";
import { sampler } from "./sampler";

describe("sampler", () => {
	describe("validation", () => {
		it("rejects empty zones array", () => {
			expect(() => sampler([])).toThrow(ResequenceError);
			expect(() => sampler([])).toThrow("zones array must not be empty");
		});
	});

	describe("region normalization", () => {
		it("normalizes zone region to composite key when sample has no #", () => {
			const node = sampler([
				{ sample: "./piano-all.wav", region: "C4-soft", root: N.C4 },
			]);
			const config = (node as unknown as { config: { zones: Array<{ sample: string }> } }).config;
			expect(config.zones[0]?.sample).toBe("./piano-all.wav#C4-soft");
		});

		it("does not duplicate # when sample already contains it", () => {
			const node = sampler([
				{ sample: "./piano-all.wav#C4-soft", region: "C4-soft", root: N.C4 },
			]);
			const config = (node as unknown as { config: { zones: Array<{ sample: string }> } }).config;
			expect(config.zones[0]?.sample).toBe("./piano-all.wav#C4-soft");
		});

		it("preserves sample as-is when no region property", () => {
			const node = sampler([{ sample: "./piano-C4.wav", root: N.C4 }]);
			const config = (node as unknown as { config: { zones: Array<{ sample: string }> } }).config;
			expect(config.zones[0]?.sample).toBe("./piano-C4.wav");
		});
	});

	describe("zone resolution: pitch + velocity", () => {
		it("selects by pitch then velocity simultaneously", () => {
			const node = sampler([
				{ sample: "./piano-C4-soft.wav", root: N.C4, velocity: 0 },
				{ sample: "./piano-C4-hard.wav", root: N.C4, velocity: 64 },
				{ sample: "./piano-C5-soft.wav", root: N.C5, velocity: 0 },
				{ sample: "./piano-C5-hard.wav", root: N.C5, velocity: 64 },
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

});
