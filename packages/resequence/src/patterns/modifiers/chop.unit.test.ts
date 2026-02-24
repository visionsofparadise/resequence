import { describe, expect, it } from "vitest";
import { note } from "../note";
import { ChopPattern, chop } from "./chop";

describe("ChopPattern", () => {
	describe("notes", () => {
		it("subdivides a quarter note into four 16th notes", () => {
			const pat = chop(note("C4", "4n"), "16n");
			expect(pat.notes).toHaveLength(4);
			expect(pat.notes[0]).toMatchObject({ tick: 0, pitch: 60, durationTicks: 120 });
			expect(pat.notes[1]).toMatchObject({ tick: 120, durationTicks: 120 });
			expect(pat.notes[2]).toMatchObject({ tick: 240, durationTicks: 120 });
			expect(pat.notes[3]).toMatchObject({ tick: 360, durationTicks: 120 });
		});

		it("preserves pitch and velocity on each sub-note", () => {
			const pat = chop(note("G4", "4n", { velocity: 80 }), "8n");
			for (const positionedNote of pat.notes) {
				expect(positionedNote.pitch).toBe(67);
				expect(positionedNote.velocity).toBe(80);
			}
		});

		it("returns empty when subdivision > note duration", () => {
			const pat = chop(note("C4", "8n"), "4n");
			expect(pat.notes).toHaveLength(0);
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(chop(note("C4", "2n"), "8n").durationTicks).toBe(960);
		});
	});

	describe("instanceof", () => {
		it("is a ChopPattern", () => {
			expect(chop(note("C4", "4n"), "8n")).toBeInstanceOf(ChopPattern);
		});
	});
});
