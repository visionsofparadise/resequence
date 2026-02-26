import { describe, expect, it } from "vitest";
import type { ScoreSlide } from "../patterns/pattern";
import { resolvePitch } from "./pitch";
import { evaluateSlide, evaluateSlideCents, mergeSlides } from "./slide";

const C4 = resolvePitch("C4");
const E4 = resolvePitch("E4");
const G4 = resolvePitch("G4");
const A4 = resolvePitch("A4");

describe("evaluateSlide", () => {
	it("returns root pitch when no slides", () => {
		expect(evaluateSlide(C4, [], 0.5)).toEqual(C4);
	});

	it("returns root pitch when beatOffset <= 0", () => {
		const slides: ScoreSlide[] = [{ beat: 1, pitch: E4, curve: 0 }];
		expect(evaluateSlide(C4, slides, 0)).toEqual(C4);
		expect(evaluateSlide(C4, slides, -1)).toEqual(C4);
	});

	it("returns last slide pitch when beatOffset >= last beat", () => {
		const slides: ScoreSlide[] = [{ beat: 1, pitch: E4, curve: 0 }];
		expect(evaluateSlide(C4, slides, 1)).toEqual(E4);
		expect(evaluateSlide(C4, slides, 2)).toEqual(E4);
	});

	it("linearly interpolates between root and first keyframe", () => {
		const slides: ScoreSlide[] = [{ beat: 1, pitch: E4, curve: 0 }];
		// C4 (class 0) to E4 (class 4), halfway = class 2 = D4
		const result = evaluateSlide(C4, slides, 0.5);
		expect(result.class).toBe(2);
		expect(result.octave).toBe(4);
	});

	it("interpolates between two keyframes", () => {
		const slides: ScoreSlide[] = [
			{ beat: 1, pitch: E4, curve: 0 },
			{ beat: 2, pitch: G4, curve: 0 },
		];
		// At beat 1.5: halfway between E4 (class 4) and G4 (class 7) = class 6 rounded = Fs4
		const result = evaluateSlide(C4, slides, 1.5);
		// (7-4)*0.5 = 1.5, rounded = 2, 4+2=6
		expect(result.class).toBe(6);
		expect(result.octave).toBe(4);
	});

	it("applies ease-in curve (positive curve)", () => {
		const slides: ScoreSlide[] = [{ beat: 1, pitch: E4, curve: 1 }];
		// At t=0.5 with curve=1: t^(1+3) = 0.5^4 = 0.0625
		// steps = 4 * 0.0625 = 0.25, rounded = 0 → still C4
		const result = evaluateSlide(C4, slides, 0.5);
		expect(result.class).toBe(0);
		expect(result.octave).toBe(4);
	});

	it("applies ease-out curve (negative curve)", () => {
		const slides: ScoreSlide[] = [{ beat: 1, pitch: E4, curve: -1 }];
		// At t=0.5 with curve=-1: 1 - (1-0.5)^(1+3) = 1 - 0.0625 = 0.9375
		// steps = 4 * 0.9375 = 3.75, rounded = 4 → E4
		const result = evaluateSlide(C4, slides, 0.5);
		expect(result.class).toBe(4);
		expect(result.octave).toBe(4);
	});
});

describe("evaluateSlideCents", () => {
	it("returns 0 when no slides", () => {
		expect(evaluateSlideCents(C4, [], 0.5)).toBe(0);
	});

	it("returns 0 when beatOffset <= 0", () => {
		const slides: ScoreSlide[] = [{ beat: 1, pitch: E4, curve: 0 }];
		expect(evaluateSlideCents(C4, slides, 0)).toBe(0);
	});

	it("returns final cents when beatOffset >= last beat", () => {
		const slides: ScoreSlide[] = [{ beat: 1, pitch: E4, curve: 0 }];
		// C4 to E4 = 4 semitones = 400 cents
		expect(evaluateSlideCents(C4, slides, 1)).toBe(400);
		expect(evaluateSlideCents(C4, slides, 2)).toBe(400);
	});

	it("linearly interpolates cents between root and first keyframe", () => {
		const slides: ScoreSlide[] = [{ beat: 1, pitch: E4, curve: 0 }];
		// At 0.5: halfway to 400 cents = 200 cents
		expect(evaluateSlideCents(C4, slides, 0.5)).toBe(200);
	});

	it("interpolates between two keyframes", () => {
		const slides: ScoreSlide[] = [
			{ beat: 1, pitch: E4, curve: 0 },
			{ beat: 2, pitch: G4, curve: 0 },
		];
		// At 1.5: halfway between 400 and 700 = 550
		expect(evaluateSlideCents(C4, slides, 1.5)).toBe(550);
	});

	it("applies curve to cents interpolation", () => {
		const slides: ScoreSlide[] = [{ beat: 1, pitch: E4, curve: 1 }];
		// At t=0.5 with curve=1: t^4 = 0.0625, cents = 400 * 0.0625 = 25
		expect(evaluateSlideCents(C4, slides, 0.5)).toBe(25);
	});
});

describe("mergeSlides", () => {
	it("merges non-overlapping slides in beat order", () => {
		const existing: ScoreSlide[] = [{ beat: 1, pitch: E4, curve: 0 }];
		const incoming: ScoreSlide[] = [{ beat: 2, pitch: G4, curve: 0 }];
		const result = mergeSlides(existing, incoming);
		expect(result).toEqual([
			{ beat: 1, pitch: E4, curve: 0 },
			{ beat: 2, pitch: G4, curve: 0 },
		]);
	});

	it("incoming wins on beat overlap", () => {
		const existing: ScoreSlide[] = [{ beat: 1, pitch: E4, curve: 0 }];
		const incoming: ScoreSlide[] = [{ beat: 1, pitch: G4, curve: 0.5 }];
		const result = mergeSlides(existing, incoming);
		expect(result).toEqual([{ beat: 1, pitch: G4, curve: 0.5 }]);
	});

	it("handles empty arrays", () => {
		expect(mergeSlides([], [])).toEqual([]);
		const slides: ScoreSlide[] = [{ beat: 1, pitch: E4, curve: 0 }];
		expect(mergeSlides(slides, [])).toEqual(slides);
		expect(mergeSlides([], slides)).toEqual(slides);
	});

	it("sorts mixed beat positions correctly", () => {
		const existing: ScoreSlide[] = [{ beat: 3, pitch: A4, curve: 0 }];
		const incoming: ScoreSlide[] = [
			{ beat: 1, pitch: E4, curve: 0 },
			{ beat: 2, pitch: G4, curve: 0 },
		];
		const result = mergeSlides(existing, incoming);
		expect(result).toHaveLength(3);
		expect(result[0].beat).toBe(1);
		expect(result[1].beat).toBe(2);
		expect(result[2].beat).toBe(3);
	});
});
