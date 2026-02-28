import { describe, expect, it } from "vitest";
import { note } from "../patterns/note";
import { sequence } from "../patterns/sequence";
import { collectNotes } from "../patterns/utils/tree";
import { Chromatic, N } from "./chromatic";
import { resolveDuration } from "./duration";
import { resolvePitch, pitchToCents } from "./pitch";
import { createTuning } from "./tuning";


describe("createTuning", () => {
	describe("namespace shape", () => {
		it("generates entries for every class × octave combination", () => {
			const tuning = createTuning({
				classes: ["C", "D", "E"],
				octaveRatio: 2,
				reference: { class: "C", octave: 4, hz: 264 },
			});
			// 3 classes × 10 octaves (0–9) = 30 entries
			expect(Object.keys(tuning)).toHaveLength(30);
			expect(tuning["C4"]).toBeDefined();
			expect(tuning["E9"]).toBeDefined();
		});

		it("each entry has the correct pitch struct", () => {
			const tuning = createTuning({
				classes: ["C", "D", "E"],
				octaveRatio: 2,
				reference: { class: "C", octave: 4, hz: 264 },
			});
			expect(tuning["C4"]!.pitch).toEqual({ class: 0, stepsPerOctave: 3, octave: 4, octaveRatio: 2 });
			expect(tuning["D4"]!.pitch).toEqual({ class: 1, stepsPerOctave: 3, octave: 4, octaveRatio: 2 });
			expect(tuning["E3"]!.pitch).toEqual({ class: 2, stepsPerOctave: 3, octave: 3, octaveRatio: 2 });
		});

		it("entry.for() returns a ScoreNote with the entry pitch", () => {
			const tuning = createTuning({
				classes: ["C", "D"],
				octaveRatio: 2,
				reference: { class: "C", octave: 4, hz: 264 },
			});
			const scoreNote = tuning["C4"]!.for("4n");
			expect(scoreNote).toEqual(note(tuning["C4"]!.pitch, resolveDuration("4n")));
		});

		it("entry.for() accepts velocity", () => {
			const tuning = createTuning({
				classes: ["C"],
				octaveRatio: 2,
				reference: { class: "C", octave: 4, hz: 264 },
			});
			const scoreNote = tuning["C4"]!.for("4n", 80);
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
	it("N.C4.pitch equals 12-EDO C4", () => {
		expect(N["C4"]!.pitch).toEqual(resolvePitch("C4"));
	});

	it("N.Fs4.pitch.class is 6", () => {
		expect(N["Fs4"]!.pitch.class).toBe(6);
	});

	it("N.Bb3.pitch equals 12-EDO Bb3 (class 10, octave 3)", () => {
		expect(N["Bb3"]!.pitch).toEqual({ class: 10, stepsPerOctave: 12, octave: 3, octaveRatio: 2 });
	});

	it("flat aliases are enharmonic equivalents of sharps", () => {
		expect(N["Db4"]!.pitch).toEqual(N["Cs4"]!.pitch);
		expect(N["Eb4"]!.pitch).toEqual(N["Ds4"]!.pitch);
		expect(N["Ab4"]!.pitch).toEqual(N["Gs4"]!.pitch);
	});

	it("Cb4 is enharmonic to B3 (octave crossing)", () => {
		expect(N["Cb4"]!.pitch).toEqual(N["B3"]!.pitch);
	});

	it("N entry.for() produces correct ScoreNote", () => {
		const scoreNote = N["C4"]!.for("8n");
		expect(scoreNote.endBeat - scoreNote.startBeat).toBe(0.5);
		expect(scoreNote.pitch).toEqual(resolvePitch("C4"));
	});
});

describe("Chromatic", () => {
	it("includes all N entries", () => {
		expect((Chromatic as Record<string, unknown>)["C4"]).toBeDefined();
		expect((Chromatic as Record<string, unknown>)["B9"]).toBeDefined();
	});

	describe("chord()", () => {
		it("builds a major triad from root pitch", () => {
			const pat = Chromatic.chord(N["C4"]!.pitch, "", "4n");
			expect(collectNotes(pat)).toHaveLength(3);
			// durationBeats of each note = 1 ("4n")
			expect(pat.endBeat - pat.startBeat).toBe(1);
		});

		it("builds a minor triad", () => {
			const pat = Chromatic.chord(N["C4"]!.pitch, "m", "4n");
			expect(collectNotes(pat)).toHaveLength(3);
		});

		it("builds a major seventh chord", () => {
			const pat = Chromatic.chord(N["C4"]!.pitch, "maj7", "4n");
			expect(collectNotes(pat)).toHaveLength(4);
		});

		it("throws on unknown quality", () => {
			expect(() => Chromatic.chord(N["C4"]!.pitch, "xyz", "4n")).toThrow();
		});
	});

	describe("scale()", () => {
		it("returns a scale accessor from Chromatic.scale", () => {
			const cMajor = Chromatic.scale("C4 major");
			expect(cMajor(1)).toBe("C4");
			expect(cMajor(5)).toBe("G4");
		});
	});
});

describe("tuning context", () => {
	it("pitchToCents uses frequency table for non-equal tunings", () => {
		// Just intonation: major third C→E is 386 cents (5/4 ratio), vs 400 in equal temperament
		const justConfig = {
			classes: ["C", "D", "E", "F", "G", "A", "B"],
			octaveRatio: 2,
			reference: { class: "A", octave: 4, hz: 440 },
			frequencies: { C: 264, D: 297, E: 330, F: 352, G: 396, A: 440, B: 495 },
		};
		const justTuning = createTuning(justConfig);

		const c4 = justTuning["C4"]!.pitch;
		const e4 = justTuning["E4"]!.pitch;

		// With just intonation: 1200 * log2(330/264) ≈ 386.31 cents
		const justCents = pitchToCents(c4, e4, justConfig);
		expect(justCents).toBeCloseTo(386.31, 0);

		// Without tuning context: equal temperament using 12-EDO pitches, 4 semitones = 400 cents
		const eqCents = pitchToCents(resolvePitch("C4"), resolvePitch("E4"));
		expect(eqCents).toBeCloseTo(400, 1);
	});

	it("pitchToCents falls back to equal temperament when no frequencies table", () => {
		const noFreqConfig = {
			classes: ["C", "D", "E", "F", "G", "A", "B"],
			octaveRatio: 2,
			reference: { class: "A", octave: 4, hz: 440 },
		};
		const noFreqTuning = createTuning(noFreqConfig);

		const c4 = noFreqTuning["C4"]!.pitch;
		const e4 = noFreqTuning["E4"]!.pitch;

		// Without frequencies, falls back to equal-temperament formula
		// In 7-EDO, C=0, E=2, so 2/7 octave = 2/7 * 1200 ≈ 342.86 cents
		const cents = pitchToCents(c4, e4, noFreqConfig);
		expect(cents).toBeCloseTo((2 / 7) * 1200, 1);
	});
});
