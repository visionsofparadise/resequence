import { describe, expect, it } from "vitest";
import type { Keyframe } from "../automation/keyframe";
import { N } from "../tunings/chromatic";
import { normalizePitch } from "./pitch";
import { evaluateSlide, evaluateSlideCents, mergeSlides } from "./slide";

const C4 = N.C4;
const E4 = N.E4;
const G4 = N.G4;

describe("evaluateSlide", () => {
	it("returns root pitch when no slides", () => {
		expect(evaluateSlide(C4, [], 0.5)).toEqual(C4);
	});

	it("returns root pitch when beatOffset <= 0", () => {
		const slides: Keyframe[] = [{ beat: 1, value: normalizePitch(E4) }];
		expect(evaluateSlide(C4, slides, 0)).toEqual(C4);
		expect(evaluateSlide(C4, slides, -1)).toEqual(C4);
	});

	it("returns last slide pitch when beatOffset >= last beat", () => {
		const slides: Keyframe[] = [{ beat: 1, value: normalizePitch(E4) }];
		expect(evaluateSlide(C4, slides, 1)).toEqual({ class: E4.class, stepsPerOctave: 12, octave: 4, octaveRatio: 2 });
		expect(evaluateSlide(C4, slides, 2)).toEqual({ class: E4.class, stepsPerOctave: 12, octave: 4, octaveRatio: 2 });
	});

	it("linearly interpolates between root and first keyframe", () => {
		const slides: Keyframe[] = [{ beat: 1, value: normalizePitch(E4) }];
		// C4 (class 0) to E4 (class 4), halfway = class 2 = D4
		const result = evaluateSlide(C4, slides, 0.5);
		expect(result.class).toBe(2);
		expect(result.octave).toBe(4);
	});

	it("interpolates between two keyframes", () => {
		const slides: Keyframe[] = [
			{ beat: 1, value: normalizePitch(E4) },
			{ beat: 2, value: normalizePitch(G4) },
		];
		// At beat 1.5: halfway between E4 (class 4) and G4 (class 7) = class 6 rounded = Fs4
		const result = evaluateSlide(C4, slides, 1.5);
		expect(result.class).toBe(6);
		expect(result.octave).toBe(4);
	});

	it("applies ease-in curve (positive curve)", () => {
		const slides: Keyframe[] = [{ beat: 1, value: normalizePitch(E4), curve: 1 }];
		// At t=0.5 with curve=1: t^(1+3) = 0.5^4 = 0.0625
		// steps = 4 * 0.0625 = 0.25, rounded = 0 → still C4
		const result = evaluateSlide(C4, slides, 0.5);
		expect(result.class).toBe(0);
		expect(result.octave).toBe(4);
	});

	it("applies ease-out curve (negative curve)", () => {
		const slides: Keyframe[] = [{ beat: 1, value: normalizePitch(E4), curve: -1 }];
		// At t=0.5 with curve=-1: 1 - (1-0.5)^(1+3) = 1 - 0.0625 = 0.9375
		// steps = 4 * 0.9375 = 3.75, rounded = 4 → E4
		const result = evaluateSlide(C4, slides, 0.5);
		expect(result.class).toBe(4);
		expect(result.octave).toBe(4);
	});
});

describe("evaluateSlideCents", () => {
	it("returns final cents when beatOffset >= last beat", () => {
		const slides: Keyframe[] = [{ beat: 1, value: normalizePitch(E4) }];
		// C4 to E4 = 4 semitones = 400 cents
		expect(evaluateSlideCents(C4, slides, 1)).toBe(400);
		expect(evaluateSlideCents(C4, slides, 2)).toBe(400);
	});

	it("linearly interpolates cents between root and first keyframe", () => {
		const slides: Keyframe[] = [{ beat: 1, value: normalizePitch(E4) }];
		// At 0.5: halfway to 400 cents = 200 cents
		expect(evaluateSlideCents(C4, slides, 0.5)).toBe(200);
	});
});

describe("mergeSlides", () => {
	it("merges non-overlapping slides in beat order", () => {
		const existing: Keyframe[] = [{ beat: 1, value: normalizePitch(E4) }];
		const incoming: Keyframe[] = [{ beat: 2, value: normalizePitch(G4) }];
		const result = mergeSlides(existing, incoming);
		expect(result).toEqual([
			{ beat: 1, value: normalizePitch(E4) },
			{ beat: 2, value: normalizePitch(G4) },
		]);
	});

	it("incoming wins on beat overlap", () => {
		const existing: Keyframe[] = [{ beat: 1, value: normalizePitch(E4) }];
		const incoming: Keyframe[] = [{ beat: 1, value: normalizePitch(G4), curve: 0.5 }];
		const result = mergeSlides(existing, incoming);
		expect(result).toEqual([{ beat: 1, value: normalizePitch(G4), curve: 0.5 }]);
	});

	it("handles empty arrays", () => {
		expect(mergeSlides([], [])).toEqual([]);
		const slides: Keyframe[] = [{ beat: 1, value: normalizePitch(E4) }];
		expect(mergeSlides(slides, [])).toEqual(slides);
		expect(mergeSlides([], slides)).toEqual(slides);
	});
});
