import { describe, expect, it } from "vitest";
import { resolveDuration } from "../../utils/duration";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { ChopPattern, chop } from "./chop";

describe("ChopPattern", () => {
	describe("notes", () => {
		it("subdivides a quarter note into four 16th notes", () => {
			const pat = chop(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), "16n");
			const notes = collectNotes(pat);
			expect(notes).toHaveLength(4);
			expect(notes[0]).toMatchObject({ startBeat: 0, pitch: resolvePitch("C4"), endBeat: 0.25 });
			expect(notes[1]).toMatchObject({ startBeat: 0.25, endBeat: 0.5 });
			expect(notes[2]).toMatchObject({ startBeat: 0.5, endBeat: 0.75 });
			expect(notes[3]).toMatchObject({ startBeat: 0.75, endBeat: 1 });
		});

		it("preserves pitch and velocity on each sub-note", () => {
			const pat = chop(sequence(note(resolvePitch("G4"), resolveDuration("4n"), { velocity: 80 })), "8n");
			for (const positionedNote of collectNotes(pat)) {
				expect(positionedNote.pitch).toEqual(resolvePitch("G4"));
				expect(positionedNote.velocity).toBe(80);
			}
		});

		it("returns empty when subdivision > note duration", () => {
			const pat = chop(sequence(note(resolvePitch("C4"), resolveDuration("8n"))), "4n");
			expect(collectNotes(pat)).toHaveLength(0);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			const pat = chop(sequence(note(resolvePitch("C4"), resolveDuration("2n"))), "8n");
			expect(pat.endBeat - pat.startBeat).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is a ChopPattern", () => {
			expect(chop(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), "8n")).toBeInstanceOf(ChopPattern);
		});
	});
});
