import { describe, expect, it } from "vitest";
import { pitchKey } from "../pitch";
import { layer } from "../patterns/layer";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { arp, arpUp } from "./arp";

describe("arp", () => {
	it("arpeggiates chord through mapping", () => {
		const chord = layer(N.C4(4), N.E4(4), N.G4(4));
		const mapping = arpUp(3, 1);
		const result = arp(chord, mapping);
		const notes = collectNotes(result);
		// Should produce arpeggiated output cycling through chord tones
		expect(notes.length).toBeGreaterThan(0);
		const pitches = notes.map((n) => pitchKey(n.note.pitch));
		// All pitches should be from the chord pool
		const chordKeys = [pitchKey(N.C4(1).pitch), pitchKey(N.E4(1).pitch), pitchKey(N.G4(1).pitch)];
		for (const p of pitches) {
			expect(chordKeys).toContain(p);
		}
	});
});
