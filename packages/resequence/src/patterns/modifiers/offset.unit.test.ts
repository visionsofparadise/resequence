import { describe, expect, it } from "vitest";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { OffsetPattern, offset } from "./offset";

describe("OffsetPattern", () => {
	describe("notes", () => {
		it("shifts all beat positions by positive amount", () => {
			const pat = offset(sequence(note("C4", "4n"), note("E4", "4n")), "16n");
			expect(pat.notes).toMatchObject([
				{ beat: 0.25, pitch: resolvePitch("C4") },
				{ beat: 1.25, pitch: resolvePitch("E4") },
			]);
		});

		it("shifts by negative amount", () => {
			const pat = offset(sequence(note("C4", "4n"), note("E4", "4n")), -0.25);
			expect(pat.notes[1]?.beat).toBe(0.75);
		});

		it("clamps negative-shifted notes to beat 0", () => {
			const pat = offset(note("C4", "4n"), -2);
			expect(pat.notes[0]?.beat).toBe(0);
		});

		it("accepts Duration string", () => {
			const pat = offset(note("C4", "4n"), "8n");
			expect(pat.notes[0]?.beat).toBe(0.5);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(offset(note("C4", "2n"), "8n").durationBeats).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is an OffsetPattern", () => {
			expect(offset(note("C4", "4n"), 0)).toBeInstanceOf(OffsetPattern);
		});
	});
});
