import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { pitchKey, pitchToMidi } from "../../utils/pitch";
import { layer } from "../layer";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { StrumPattern, strum } from "./strum";

// C major chord: C4=60, E4=64, G4=67
function cMajChord(): ReturnType<typeof layer> {
	return layer(sequence(N.C4(1)), sequence(N.E4(1)), sequence(N.G4(1)));
}

describe("StrumPattern", () => {
	describe("notes", () => {
		it("staggers notes from lowest to highest (up direction)", () => {
			const pat = strum(cMajChord());
			const sorted = collectNotes(pat).slice().sort((noteA, noteB) => pitchKey(noteA.pitch) - pitchKey(noteB.pitch));
			expect(sorted[0]?.startBeat).toBe(0);
			expect(sorted[1]?.startBeat).toBe(15);
			expect(sorted[2]?.startBeat).toBe(30);
		});

		it("staggers notes from highest to lowest (down direction)", () => {
			const pat = strum(cMajChord(), { direction: "down" });
			const pitchOrder = collectNotes(pat).map((positionedNote) => positionedNote.pitch);
			// G4 is staggered first (beat 0), then E4, then C4
			const g4 = collectNotes(pat).find((positionedNote) => pitchToMidi(positionedNote.pitch).note === 67)!;
			const c4 = collectNotes(pat).find((positionedNote) => pitchToMidi(positionedNote.pitch).note === 60)!;
			expect(g4.startBeat).toBeLessThan(c4.startBeat);
			expect(pitchOrder).toBeDefined();
		});

		it("uses custom strumOffset", () => {
			const pat = strum(cMajChord(), { strumOffset: 10 });
			const sorted = collectNotes(pat).slice().sort((noteA, noteB) => pitchKey(noteA.pitch) - pitchKey(noteB.pitch));
			expect(sorted[1]?.startBeat).toBe(10);
			expect(sorted[2]?.startBeat).toBe(20);
		});

		it("returns empty for empty child", () => {
			expect(collectNotes(strum(layer()))).toEqual([]);
		});
	});

	describe("durationBeats", () => {
		it("extends duration to accommodate strum offsets", () => {
			// 3 notes, default strumOffset=15, last note at beat 30 + dur 1 = endBeat 31
			expect(strum(cMajChord()).endBeat - strum(cMajChord()).startBeat).toBe(31);
		});
	});

	describe("instanceof", () => {
		it("is a StrumPattern", () => {
			expect(strum(cMajChord())).toBeInstanceOf(StrumPattern);
		});
	});
});
