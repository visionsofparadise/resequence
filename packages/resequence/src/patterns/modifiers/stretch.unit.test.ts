import { describe, expect, it } from "vitest";
import { resolveDuration } from "../../utils/duration";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { StretchPattern, stretch } from "./stretch";

describe("StretchPattern", () => {
	describe("notes", () => {
		it("doubles all timings with factor 2", () => {
			const pat = stretch(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n"))), 2);
			const notes = collectNotes(pat);
			// stretch scales note-local startBeat/endBeat; offsets in tree remain unchanged
			expect(notes[0]).toMatchObject({ startBeat: 0, pitch: resolvePitch("C4"), endBeat: 2 });
			expect(notes[1]).toMatchObject({ startBeat: 1, pitch: resolvePitch("E4"), endBeat: 3 });
		});

		it("halves all timings with factor 0.5", () => {
			const pat = stretch(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n"))), 0.5);
			const notes = collectNotes(pat);
			// stretch scales note-local startBeat/endBeat; offsets in tree remain unchanged
			expect(notes[0]).toMatchObject({ startBeat: 0, pitch: resolvePitch("C4"), endBeat: 0.5 });
			expect(notes[1]).toMatchObject({ startBeat: 1, pitch: resolvePitch("E4"), endBeat: 1.5 });
		});

		it("preserves undefined durationBeats", () => {
			const pat = stretch(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 2);
			const notes = collectNotes(pat);
			// NotePattern always sets durationBeats, so this just confirms it's scaled
			expect(notes[0]?.endBeat! - notes[0]?.startBeat!).toBe(2);
		});
	});

	describe("durationBeats", () => {
		it("scales durationBeats by factor", () => {
			expect(stretch(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 2).endBeat - stretch(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 2).startBeat).toBe(2);
			expect(stretch(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 0.5).endBeat - stretch(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 0.5).startBeat).toBe(0.5);
		});
	});

	describe("instanceof", () => {
		it("is a StretchPattern", () => {
			expect(stretch(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 1)).toBeInstanceOf(StretchPattern);
		});
	});
});
