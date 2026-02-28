import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { pitchKey, pitchToMidi } from "../../utils/pitch";
import { layer } from "../layer";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { strum } from "./strum";

function cMajChord(): ReturnType<typeof layer> {
	return layer(sequence(N.C4(1)), sequence(N.E4(1)), sequence(N.G4(1)));
}

describe("StrumPattern", () => {
	it("staggers notes from lowest to highest (up direction)", () => {
		const pat = strum(cMajChord());
		const sorted = collectNotes(pat).slice().sort((noteA, noteB) => pitchKey(noteA.pitch) - pitchKey(noteB.pitch));
		expect(sorted[0]?.startBeat).toBe(0);
		expect(sorted[1]?.startBeat).toBe(15);
		expect(sorted[2]?.startBeat).toBe(30);
	});

	it("staggers notes from highest to lowest (down direction)", () => {
		const pat = strum(cMajChord(), { direction: "down" });
		const g4 = collectNotes(pat).find((positionedNote) => pitchToMidi(positionedNote.pitch).note === 67)!;
		const c4 = collectNotes(pat).find((positionedNote) => pitchToMidi(positionedNote.pitch).note === 60)!;
		expect(g4.startBeat).toBeLessThan(c4.startBeat);
	});

	it("returns empty for empty child", () => {
		expect(collectNotes(strum(layer()))).toEqual([]);
	});
});
