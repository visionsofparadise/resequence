import { describe, expect, it } from "vitest";
import { layer } from "../layer";
import { note } from "../note";
import { ArpPattern, arp, arpDown, arpRandom, arpUp, arpUpDown } from "./arp";

// Cm chord: C4=60, Eb4=63, G4=67
function cmChord(): ReturnType<typeof layer> {
	return layer(note("C4", "1n"), note("Eb4", "1n"), note("G4", "1n"));
}

describe("ArpPattern", () => {
	describe("notes", () => {
		it("cycles arpUp through chord pitches to fill duration", () => {
			const pat = arp(cmChord(), arpUp(3, "8n"));
			// 1n = 1920 ticks, 8n = 240 ticks → 8 steps
			expect(pat.notes).toHaveLength(8);
		});

		it("produces correct pitch sequence from arpUp", () => {
			const pat = arp(cmChord(), arpUp(3, "8n"));
			const pitches = pat.notes.map((positionedNote) => positionedNote.pitch);
			// Pool: [60, 63, 67] → indices [0, 1, 2, 0, 1, 2, 0, 1]
			expect(pitches[0]).toBe(60);
			expect(pitches[1]).toBe(63);
			expect(pitches[2]).toBe(67);
			expect(pitches[3]).toBe(60);
		});

		it("produces correct pitch sequence from arpDown", () => {
			const pat = arp(cmChord(), arpDown(3, "8n"));
			const pitches = pat.notes.map((positionedNote) => positionedNote.pitch);
			// Pool sorted ascending: [60, 63, 67], arpDown indices: [2, 1, 0]
			expect(pitches[0]).toBe(67);
			expect(pitches[1]).toBe(63);
			expect(pitches[2]).toBe(60);
		});

		it("arpUpDown produces up-then-down sequence", () => {
			const pat = arp(cmChord(), arpUpDown(3, "8n"));
			// arpUpDown(3): pitches [0, 1, 2, 1] → [C4, Eb4, G4, Eb4] repeating
			const pitches = pat.notes.map((positionedNote) => positionedNote.pitch);
			expect(pitches[0]).toBe(60);
			expect(pitches[1]).toBe(63);
			expect(pitches[2]).toBe(67);
			expect(pitches[3]).toBe(63);
		});

		it("arpRandom with seed produces same result every run", () => {
			const pat1 = arp(cmChord(), arpRandom(3, "8n", 42));
			const pat2 = arp(cmChord(), arpRandom(3, "8n", 42));
			expect(pat1.notes.map((positionedNote) => positionedNote.pitch)).toEqual(
				pat2.notes.map((positionedNote) => positionedNote.pitch),
			);
		});

		it("returns empty for empty child", () => {
			expect(arp(layer(), arpUp(3, "8n")).notes).toEqual([]);
		});
	});

	describe("durationTicks", () => {
		it("uses child durationTicks", () => {
			expect(arp(cmChord(), arpUp(3, "8n")).durationTicks).toBe(1920);
		});
	});

	describe("instanceof", () => {
		it("is an ArpPattern", () => {
			expect(arp(cmChord(), arpUp(3, "8n"))).toBeInstanceOf(ArpPattern);
		});
	});
});
