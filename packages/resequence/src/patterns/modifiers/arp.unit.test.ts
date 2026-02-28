import { N } from "../../tunings/chromatic";
import { describe, expect, it } from "vitest";
import { pitchToMidi } from "../../utils/pitch";
import { layer } from "../layer";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { arp, arpRandom, arpUp } from "./arp";

function cmChord(): ReturnType<typeof layer> {
	return layer(sequence(N.C4(4)), sequence(N.Eb4(4)), sequence(N.G4(4)));
}
function sortedNotes(pat: ReturnType<typeof arp>) {
	return collectNotes(pat).sort((a, b) => a.startBeat - b.startBeat);
}
describe("arp", () => {
	it("cycles arpUp through chord pitches to fill duration", () => {
		const pat = arp(cmChord(), arpUp(3, 0.5));
		expect(collectNotes(pat)).toHaveLength(8);
	});

	it("produces correct pitch sequence from arpUp", () => {
		const pat = arp(cmChord(), arpUp(3, 0.5));
		const pitches = sortedNotes(pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note);
		expect(pitches[0]).toBe(60);
		expect(pitches[1]).toBe(63);
		expect(pitches[2]).toBe(67);
		expect(pitches[3]).toBe(60);
	});

	it("arpRandom with seed produces same result every run", () => {
		const pat1 = arp(cmChord(), arpRandom(3, 0.5, 42));
		const pat2 = arp(cmChord(), arpRandom(3, 0.5, 42));
		expect(sortedNotes(pat1).map((positionedNote) => pitchToMidi(positionedNote.pitch).note)).toEqual(
			sortedNotes(pat2).map((positionedNote) => pitchToMidi(positionedNote.pitch).note),
		);
	});

	it("returns empty for empty child", () => {
		expect(collectNotes(arp(layer(), arpUp(3, 0.5)))).toEqual([]);
	});
});
