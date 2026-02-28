import { describe, expect, it } from "vitest";
import { resolveDuration } from "../../utils/duration";
import { pitchToMidi, resolvePitch } from "../../utils/pitch";
import { layer } from "../layer";
import { note } from "../note";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { ArpPattern, arp, arpDown, arpRandom, arpUp, arpUpDown } from "./arp";

// Cm chord: C4=60, Eb4=63, G4=67
function cmChord(): ReturnType<typeof layer> {
	return layer(sequence(note(resolvePitch("C4"), resolveDuration("1n"))), sequence(note(resolvePitch("Eb4"), resolveDuration("1n"))), sequence(note(resolvePitch("G4"), resolveDuration("1n"))));
}

function sortedNotes(pat: ReturnType<typeof arp>) {
	return collectNotes(pat).sort((a, b) => a.startBeat - b.startBeat);
}

describe("ArpPattern", () => {
	describe("notes", () => {
		it("cycles arpUp through chord pitches to fill duration", () => {
			const pat = arp(cmChord(), arpUp(3, resolveDuration("8n")));
			// 1n = 4 beats, 8n = 0.5 beats → 8 steps
			expect(collectNotes(pat)).toHaveLength(8);
		});

		it("produces correct pitch sequence from arpUp", () => {
			const pat = arp(cmChord(), arpUp(3, resolveDuration("8n")));
			const pitches = sortedNotes(pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note);
			// Pool: [C4=60, Eb4=63, G4=67] → indices [0, 1, 2, 0, 1, 2, 0, 1]
			expect(pitches[0]).toBe(60);
			expect(pitches[1]).toBe(63);
			expect(pitches[2]).toBe(67);
			expect(pitches[3]).toBe(60);
		});

		it("produces correct pitch sequence from arpDown", () => {
			const pat = arp(cmChord(), arpDown(3, resolveDuration("8n")));
			const pitches = sortedNotes(pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note);
			// Pool sorted ascending: [C4=60, Eb4=63, G4=67], arpDown indices: [2, 1, 0]
			expect(pitches[0]).toBe(67);
			expect(pitches[1]).toBe(63);
			expect(pitches[2]).toBe(60);
		});

		it("arpUpDown produces up-then-down sequence", () => {
			const pat = arp(cmChord(), arpUpDown(3, resolveDuration("8n")));
			// arpUpDown(3): pitches [0, 1, 2, 1] → [C4, Eb4, G4, Eb4] repeating
			const pitches = sortedNotes(pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note);
			expect(pitches[0]).toBe(60);
			expect(pitches[1]).toBe(63);
			expect(pitches[2]).toBe(67);
			expect(pitches[3]).toBe(63);
		});

		it("arpRandom with seed produces same result every run", () => {
			const pat1 = arp(cmChord(), arpRandom(3, resolveDuration("8n"), 42));
			const pat2 = arp(cmChord(), arpRandom(3, resolveDuration("8n"), 42));
			expect(sortedNotes(pat1).map((positionedNote) => resolvePitch(pitchToMidi(positionedNote.pitch).note))).toEqual(
				sortedNotes(pat2).map((positionedNote) => resolvePitch(pitchToMidi(positionedNote.pitch).note)),
			);
		});

		it("returns empty for empty child", () => {
			expect(collectNotes(arp(layer(), arpUp(3, resolveDuration("8n"))))).toEqual([]);
		});
	});

	describe("durationBeats", () => {
		it("uses child durationBeats", () => {
			const pat = arp(cmChord(), arpUp(3, resolveDuration("8n")));
			expect(pat.endBeat - pat.startBeat).toBe(4);
		});
	});

	describe("instanceof", () => {
		it("is an ArpPattern", () => {
			expect(arp(cmChord(), arpUp(3, resolveDuration("8n")))).toBeInstanceOf(ArpPattern);
		});
	});
});
