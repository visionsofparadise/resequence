import { describe, expect, it } from "vitest";
import { addSteps, denormalizePitch, normalizePitch, pitchToMidi } from "./pitch";
import { N } from "./tunings/chromatic";
import { createTuning } from "./tuning";

describe("pitchToMidi", () => {
	it("converts C4 to MIDI 60", () => {
		const result = pitchToMidi(N.C4);
		expect(result.note).toBe(60);
		expect(result.bend).toBeCloseTo(0, 5);
	});

	it("converts A4 to MIDI 69", () => {
		const result = pitchToMidi(N.A4);
		expect(result.note).toBe(69);
		expect(result.bend).toBeCloseTo(0, 5);
	});

	it("converts C5 to MIDI 72", () => {
		const result = pitchToMidi(N.C5);
		expect(result.note).toBe(72);
	});
});

describe("addSteps", () => {
	it("adds positive steps", () => {
		const result = addSteps(N.C4, 4);
		expect(result.class).toBe(4); // E
		expect(result.octave).toBe(4);
	});

	it("wraps across octave boundary", () => {
		const result = addSteps(N.B4, 1);
		expect(result.class).toBe(0); // C
		expect(result.octave).toBe(5);
	});

	it("handles negative steps", () => {
		const result = addSteps(N.C4, -1);
		expect(result.class).toBe(11); // B
		expect(result.octave).toBe(3);
	});
});

describe("normalizePitch / denormalizePitch", () => {
	it("round-trips", () => {
		const normalized = normalizePitch(N.C4);
		const result = denormalizePitch(normalized, 12, 2);
		expect(result.class).toBe(N.C4.class);
		expect(result.octave).toBe(N.C4.octave);
	});
});

describe("createTuning", () => {
	it("creates equal temperament tuning", () => {
		const tuning = createTuning({
			classes: ["C", "D", "E"] as const,
			reference: { class: "C", octave: 4, hz: 261.63 },
		});

		expect(tuning.C4).toBeDefined();
		expect(tuning.C4.hz).toBeCloseTo(261.63, 1);
		expect(tuning.C4.stepsPerOctave).toBe(3);
	});

	it("creates frequency-based tuning", () => {
		const tuning = createTuning({
			frequencies: { C: 261.63, E: 329.63, G: 392 },
			referenceOctave: 4,
		});

		expect(tuning.C4.hz).toBeCloseTo(261.63, 1);
		expect(tuning.E4.hz).toBeCloseTo(329.63, 1);
	});
});
