import { describe, expect, it } from "vitest";
import { resolvePitch } from "../../utils/pitch";
import { note } from "../note";
import { ChopPattern, chop } from "./chop";

describe("ChopPattern", () => {
	describe("notes", () => {
		it("subdivides a quarter note into four 16th notes", () => {
			const pat = chop(note("C4", "4n"), "16n");
			expect(pat.notes).toHaveLength(4);
			expect(pat.notes[0]).toMatchObject({ beat: 0, pitch: resolvePitch("C4"), durationBeats: 0.25 });
			expect(pat.notes[1]).toMatchObject({ beat: 0.25, durationBeats: 0.25 });
			expect(pat.notes[2]).toMatchObject({ beat: 0.5, durationBeats: 0.25 });
			expect(pat.notes[3]).toMatchObject({ beat: 0.75, durationBeats: 0.25 });
		});

		it("preserves pitch and velocity on each sub-note", () => {
			const pat = chop(note("G4", "4n", { velocity: 80 }), "8n");
			for (const positionedNote of pat.notes) {
				expect(positionedNote.pitch).toEqual(resolvePitch("G4"));
				expect(positionedNote.velocity).toBe(80);
			}
		});

		it("returns empty when subdivision > note duration", () => {
			const pat = chop(note("C4", "8n"), "4n");
			expect(pat.notes).toHaveLength(0);
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(chop(note("C4", "2n"), "8n").durationBeats).toBe(2);
		});
	});

	describe("instanceof", () => {
		it("is a ChopPattern", () => {
			expect(chop(note("C4", "4n"), "8n")).toBeInstanceOf(ChopPattern);
		});
	});
});
