import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { EchoPattern, echo } from "./echo";

describe("EchoPattern", () => {
	describe("notes", () => {
		it("adds the specified number of echo copies", () => {
			const pat = echo(sequence(N.C4(1)), 1, 2, 0.5);
			expect(collectNotes(pat)).toHaveLength(3); // original + 2 echoes
		});

		it("spaces echoes by interval", () => {
			const pat = echo(sequence(N.C4(1)), 1, 2, 0.5);
			const notes = collectNotes(pat);
			expect(notes[0]).toMatchObject({ startBeat: 0 });
			expect(notes[1]).toMatchObject({ startBeat: 1 });
			expect(notes[2]).toMatchObject({ startBeat: 2 });
		});

		it("applies decay to echo velocity", () => {
			const pat = echo(sequence(N.C4(1, { velocity: 100 })), 1, 2, 0.5);
			const notes = collectNotes(pat);
			expect(notes[0]!.velocity).toBe(100);
			expect(notes[1]!.velocity).toBe(50); // 100 * 0.5^1
			expect(notes[2]!.velocity).toBe(25); // 100 * 0.5^2
		});

		it("clamps echo velocity to minimum 1", () => {
			// 1 * 0.1^1 = 0.1, rounds to 0, clamped to 1
			const pat = echo(sequence(N.C4(1, { velocity: 1 })), 1, 1, 0.1);
			expect(collectNotes(pat)[1]!.velocity).toBe(1);
		});

		it("preserves pitch on all copies", () => {
			const pat = echo(sequence(N.G4(1)), 1, 2, 0.5);
			for (const positionedNote of collectNotes(pat)) {
				expect(positionedNote.pitch).toEqual(N.G4);
			}
		});
	});

	describe("durationBeats", () => {
		it("extends to cover echoed notes", () => {
			// original: 0-1, echo1: 1-2, echo2: 2-3 → extent = 3
			const pat = echo(sequence(N.C4(1)), 1, 2, 0.5);
			expect(pat.endBeat - pat.startBeat).toBe(3);
		});
	});

	describe("instanceof", () => {
		it("is an EchoPattern", () => {
			expect(echo(sequence(N.C4(1)), 1, 2, 0.5)).toBeInstanceOf(EchoPattern);
		});
	});
});
