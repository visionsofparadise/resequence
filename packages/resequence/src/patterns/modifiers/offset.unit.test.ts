import { describe, expect, it } from "vitest";
import { resolveDuration } from "../../utils/duration";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { OffsetPattern, offset } from "./offset";

describe("OffsetPattern", () => {
	describe("notes", () => {
		it("shifts all beat positions by positive amount", () => {
			const pat = offset(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n"))), "16n");
			expect(collectNotes(pat)).toMatchObject([
				{ startBeat: 0.25, pitch: resolvePitch("C4") },
				{ startBeat: 1.25, pitch: resolvePitch("E4") },
			]);
		});

		it("shifts by negative amount", () => {
			const pat = offset(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n"))), -0.25);
			expect(collectNotes(pat)[1]?.startBeat).toBe(0.75);
		});

		it("shifts notes to negative beats", () => {
			const pat = offset(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), -2);
			expect(collectNotes(pat)[0]?.startBeat).toBe(-2);
		});

		it("accepts Duration string", () => {
			const pat = offset(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), "8n");
			expect(collectNotes(pat)[0]?.startBeat).toBe(0.5);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(offset(sequence(note(resolvePitch("C4"), resolveDuration("2n"))), "8n").endBeat - offset(sequence(note(resolvePitch("C4"), resolveDuration("2n"))), "8n").startBeat).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is an OffsetPattern", () => {
			expect(offset(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 0)).toBeInstanceOf(OffsetPattern);
		});
	});
});
