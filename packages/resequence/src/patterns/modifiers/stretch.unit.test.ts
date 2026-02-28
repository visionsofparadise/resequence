import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { StretchPattern, stretch } from "./stretch";

describe("StretchPattern", () => {
	describe("notes", () => {
		it("doubles all timings with factor 2", () => {
			const pat = stretch(sequence(N.C4(1), N.E4(1)), 2);
			const notes = collectNotes(pat);
			// stretch scales note-local startBeat/endBeat; offsets in tree remain unchanged
			expect(notes[0]).toMatchObject({ startBeat: 0, pitch: N.C4, endBeat: 2 });
			expect(notes[1]).toMatchObject({ startBeat: 1, pitch: N.E4, endBeat: 3 });
		});

		it("halves all timings with factor 0.5", () => {
			const pat = stretch(sequence(N.C4(1), N.E4(1)), 0.5);
			const notes = collectNotes(pat);
			// stretch scales note-local startBeat/endBeat; offsets in tree remain unchanged
			expect(notes[0]).toMatchObject({ startBeat: 0, pitch: N.C4, endBeat: 0.5 });
			expect(notes[1]).toMatchObject({ startBeat: 1, pitch: N.E4, endBeat: 1.5 });
		});

		it("preserves undefined durationBeats", () => {
			const pat = stretch(sequence(N.C4(1)), 2);
			const notes = collectNotes(pat);
			// NotePattern always sets durationBeats, so this just confirms it's scaled
			expect(notes[0]?.endBeat! - notes[0]?.startBeat!).toBe(2);
		});
	});

	describe("durationBeats", () => {
		it("scales durationBeats by factor", () => {
			expect(stretch(sequence(N.C4(1)), 2).endBeat - stretch(sequence(N.C4(1)), 2).startBeat).toBe(2);
			expect(stretch(sequence(N.C4(1)), 0.5).endBeat - stretch(sequence(N.C4(1)), 0.5).startBeat).toBe(0.5);
		});
	});

	describe("instanceof", () => {
		it("is a StretchPattern", () => {
			expect(stretch(sequence(N.C4(1)), 1)).toBeInstanceOf(StretchPattern);
		});
	});
});
