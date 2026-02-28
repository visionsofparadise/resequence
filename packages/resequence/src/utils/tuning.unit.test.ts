import { Chromatic, N } from "../tunings/chromatic";
import { describe, expect, it } from "vitest";
import { note } from "../patterns/note";
import { sequence } from "../patterns/sequence";
import { collectNotes } from "../patterns/utils/tree";
import { pitchToCents } from "./pitch";
import { createTuning } from "./tuning";
describe("createTuning", () => {
	describe("namespace shape", () => {
		it("generates entries for every class x octave combination", () => {
			const tuning = createTuning({
				classes: ["C", "D", "E"],
				octaveRatio: 2,
				reference: { class: "C", octave: 4, hz: 264 },
			});
			// 3 classes x 10 octaves (0-9) = 30 entries + config
			expect(Object.keys(tuning)).toHaveLength(31);
			expect(tuning["C4"]).toBeDefined();
			expect(tuning["E9"]).toBeDefined();
		});
		it("each entry has the correct pitch fields", () => {
			const tuning = createTuning({
				classes: ["C", "D", "E"],
				octaveRatio: 2,
				reference: { class: "C", octave: 4, hz: 264 },
			});
			const c4 = tuning["C4"]!;
			expect(c4.class).toBe(0);
			expect(c4.stepsPerOctave).toBe(3);
			expect(c4.octave).toBe(4);
			expect(c4.octaveRatio).toBe(2);
			const d4 = tuning["D4"]!;
			expect(d4.class).toBe(1);
			expect(d4.stepsPerOctave).toBe(3);
			expect(d4.octave).toBe(4);
			expect(d4.octaveRatio).toBe(2);
			const e3 = tuning["E3"]!;
			expect(e3.class).toBe(2);
			expect(e3.stepsPerOctave).toBe(3);
			expect(e3.octave).toBe(3);
			expect(e3.octaveRatio).toBe(2);
		});
		it("callable entry returns a ScoreNote with the entry pitch", () => {
			const tuning = createTuning({
				classes: ["C", "D"],
				octaveRatio: 2,
				reference: { class: "C", octave: 4, hz: 264 },
			});
			const scoreNote = tuning["C4"]!(1);
			expect(scoreNote.startBeat).toBe(0);
			expect(scoreNote.endBeat).toBe(1);
			expect(scoreNote.velocity).toBe(100);
			expect(scoreNote.pitch.class).toBe(0);
			expect(scoreNote.pitch.stepsPerOctave).toBe(2);
			expect(scoreNote.pitch.octave).toBe(4);
		});
		it("callable entry accepts velocity", () => {
			const tuning = createTuning({
				classes: ["C"],
				octaveRatio: 2,
				reference: { class: "C", octave: 4, hz: 264 },
			});
			const scoreNote = tuning["C4"]!(1, 80);
			expect(scoreNote.velocity).toBe(80);
		});
		it("throws when reference class is not in classes", () => {
			expect(() =>
				createTuning({
					classes: ["C", "D"],
					octaveRatio: 2,
					reference: { class: "X", octave: 4, hz: 440 },
				}),
			).toThrow();
		});
	});
});
describe("N (chromatic 12-EDO namespace)", () => {
	it("N.C4 has correct 12-EDO pitch fields", () => {
		expect(N.C4.class).toBe(0);
		expect(N.C4.stepsPerOctave).toBe(12);
		expect(N.C4.octave).toBe(4);
		expect(N.C4.octaveRatio).toBe(2);
	});
	it("N.Fs4.class is 6", () => {
		expect(N.Fs4.class).toBe(6);
	});
	it("N.Bb3 has correct pitch fields (class 10, octave 3)", () => {
		expect(N.Bb3.class).toBe(10);
		expect(N.Bb3.stepsPerOctave).toBe(12);
		expect(N.Bb3.octave).toBe(3);
		expect(N.Bb3.octaveRatio).toBe(2);
	});
	it("flat aliases are enharmonic equivalents of sharps", () => {
		expect(N.Db4).toBe(N.Cs4);
		expect(N.Eb4).toBe(N.Ds4);
		expect(N.Ab4).toBe(N.Gs4);
	});
	it("Cb4 is enharmonic to B3 (octave crossing)", () => {
		expect(N.Cb4).toBe(N.B3);
	});
	it("N callable entry produces correct ScoreNote", () => {
		const scoreNote = N.C4(0.5);
		expect(scoreNote.endBeat - scoreNote.startBeat).toBe(0.5);
		expect(scoreNote.pitch.class).toBe(0);
		expect(scoreNote.pitch.stepsPerOctave).toBe(12);
		expect(scoreNote.pitch.octave).toBe(4);
	});
});
describe("Chromatic", () => {
	it("includes all N entries", () => {
		expect((Chromatic as Record<string, unknown>)["C4"]).toBeDefined();
		expect((Chromatic as Record<string, unknown>)["B9"]).toBeDefined();
	});
	describe("chord()", () => {
		it("builds a major triad from root pitch", () => {
			const pat = Chromatic.chord(N.C4, "", 1);
			expect(collectNotes(pat)).toHaveLength(3);
			// durationBeats of each note = 1 (1)
			expect(pat.endBeat - pat.startBeat).toBe(1);
		});
		it("builds a minor triad", () => {
			const pat = Chromatic.chord(N.C4, "m", 1);
			expect(collectNotes(pat)).toHaveLength(3);
		});
		it("builds a major seventh chord", () => {
			const pat = Chromatic.chord(N.C4, "maj7", 1);
			expect(collectNotes(pat)).toHaveLength(4);
		});
		it("throws on unknown quality", () => {
			expect(() => Chromatic.chord(N.C4, "xyz", 1)).toThrow();
		});
	});
	describe("scale()", () => {
		it("returns a scale accessor from Chromatic.scale", () => {
			const cMajor = Chromatic.scale("C4 major");
			expect(cMajor(1)).toBe(N.C4);
			expect(cMajor(5)).toBe(N.G4);
		});
	});
});
describe("tuning context", () => {
	it("pitchToCents uses frequency table for non-equal tunings", () => {
		// Just intonation: major third C->E is 386 cents (5/4 ratio), vs 400 in equal temperament
		const justTuning = createTuning({
			classes: ["C", "D", "E", "F", "G", "A", "B"],
			octaveRatio: 2,
			reference: { class: "A", octave: 4, hz: 440 },
		});
		const c4 = justTuning["C4"]!;
		const e4 = justTuning["E4"]!;
		// With just intonation config frequencies (which are equal-tempered 7-EDO here)
		// 2/7 octave = 2/7 * 1200 ~ 342.86 cents
		const cents = pitchToCents(c4, e4, justTuning.config);
		expect(cents).toBeCloseTo((2 / 7) * 1200, 0);
		// Without tuning context: equal temperament using 12-EDO pitches, 4 semitones = 400 cents
		const eqCents = pitchToCents(N.C4, N.E4);
		expect(eqCents).toBeCloseTo(400, 1);
	});
	it("pitchToCents with frequency-based tuning", () => {
		// Just intonation with explicit frequencies
		const justTuning = createTuning({
			frequencies: { C: 264, D: 297, E: 330, F: 352, G: 396, A: 440, B: 495 },
			referenceOctave: 4,
			octaveRatio: 2,
		});
		const c4 = justTuning["C4"]!;
		const e4 = justTuning["E4"]!;
		// 1200 * log2(330/264) ~ 386.31 cents
		const justCents = pitchToCents(c4, e4, justTuning.config);
		expect(justCents).toBeCloseTo(386.31, 0);
	});
});
