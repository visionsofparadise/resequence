import { describe, expect, it } from "vitest";
import { frequencyToNoteAndBend, pitchToFrequency } from "./frequency";
import type { Pitch } from "./pitch";
import type { ResolvedTuning } from "./tuning";
import { N } from "./tunings/chromatic";

describe("pitchToFrequency", () => {
	it("resolves A4 to 440 Hz", () => {
		expect(pitchToFrequency(N.A4, N.config)).toBeCloseTo(440, 2);
	});

	it("resolves C4 to ~261.63 Hz", () => {
		expect(pitchToFrequency(N.C4, N.config)).toBeCloseTo(261.63, 1);
	});

	it("resolves across octaves", () => {
		const a3 = pitchToFrequency(N.A3, N.config);
		const a5 = pitchToFrequency(N.A5, N.config);
		expect(a3).toBeCloseTo(220, 2);
		expect(a5).toBeCloseTo(880, 2);
	});

	it("handles pitch class not in tuning by fractional mapping", () => {
		const oddPitch: Pitch = { class: 3, stepsPerOctave: 7, octave: 4, octaveRatio: 2 };
		const freq = pitchToFrequency(oddPitch, N.config);
		expect(freq).toBeGreaterThan(0);
		expect(Number.isFinite(freq)).toBe(true);
	});

	it("works with non-12-TET tuning", () => {
		const tuning: ResolvedTuning = {
			classes: ["A", "B", "C"],
			frequencies: { A: 440, B: 523, C: 660 },
			octaveRatio: 2,
			referenceOctave: 4,
		};
		const pitch: Pitch = { class: 0, stepsPerOctave: 3, octave: 4, octaveRatio: 2 };
		expect(pitchToFrequency(pitch, tuning)).toBeCloseTo(440, 2);

		const pitch5: Pitch = { class: 0, stepsPerOctave: 3, octave: 5, octaveRatio: 2 };
		expect(pitchToFrequency(pitch5, tuning)).toBeCloseTo(880, 2);
	});
});

describe("frequencyToNoteAndBend", () => {
	it("maps 440 Hz to MIDI note 69, 0 bend", () => {
		const result = frequencyToNoteAndBend(440);
		expect(result.note).toBe(69);
		expect(result.bend).toBeCloseTo(0, 1);
	});

	it("maps 261.63 Hz to MIDI note 60", () => {
		const result = frequencyToNoteAndBend(261.6255653005986);
		expect(result.note).toBe(60);
		expect(Math.abs(result.bend)).toBeLessThan(1);
	});

	it("round-trips through pitchToFrequency", () => {
		const freq = pitchToFrequency(N.Fs3, N.config);
		const result = frequencyToNoteAndBend(freq);
		expect(result.note).toBe(54);
		expect(Math.abs(result.bend)).toBeLessThan(1);
	});
});
