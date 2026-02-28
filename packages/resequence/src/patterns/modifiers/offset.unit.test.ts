import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { OffsetPattern, offset } from "./offset";

describe("OffsetPattern", () => {
	describe("notes", () => {
		it("shifts all beat positions by positive amount", () => {
			const pat = offset(sequence(N.C4(1), N.E4(1)), 0.25);
			expect(collectNotes(pat)).toMatchObject([
				{ startBeat: 0.25, pitch: N.C4 },
				{ startBeat: 1.25, pitch: N.E4 },
			]);
		});

		it("shifts by negative amount", () => {
			const pat = offset(sequence(N.C4(1), N.E4(1)), -0.25);
			expect(collectNotes(pat)[1]?.startBeat).toBe(0.75);
		});

		it("shifts notes to negative beats", () => {
			const pat = offset(sequence(N.C4(1)), -2);
			expect(collectNotes(pat)[0]?.startBeat).toBe(-2);
		});

		it("accepts Duration string", () => {
			const pat = offset(sequence(N.C4(1)), 0.5);
			expect(collectNotes(pat)[0]?.startBeat).toBe(0.5);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(offset(sequence(N.C4(2)), 0.5).endBeat - offset(sequence(N.C4(2)), 0.5).startBeat).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is an OffsetPattern", () => {
			expect(offset(sequence(N.C4(1)), 0)).toBeInstanceOf(OffsetPattern);
		});
	});
});
