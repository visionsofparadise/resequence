import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { pitchKey } from "../../utils/pitch";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { rotate } from "./rotate";

describe("RotatePattern", () => {
	it("rotates note sequence by 1 step", () => {
		const pat = rotate(sequence(N.C4(1), N.E4(1), N.G4(1)), 1);
		const notes = collectNotes(pat).slice().sort((a, b) => a.startBeat - b.startBeat);
		expect(notes).toMatchObject([
			{ startBeat: 0, pitch: N.E4 },
			{ startBeat: 1, pitch: N.G4 },
			{ startBeat: 2, pitch: N.C4 },
		]);
	});

	it("rotating by note count returns original order", () => {
		const pat = rotate(sequence(N.C4(1), N.E4(1), N.G4(1)), 3);
		const notes = collectNotes(pat).slice().sort((a, b) => a.startBeat - b.startBeat);
		expect(notes).toMatchObject([
			{ startBeat: 0, pitch: N.C4 },
			{ startBeat: 1, pitch: N.E4 },
			{ startBeat: 2, pitch: N.G4 },
		]);
	});

	it("negative rotation wraps backwards", () => {
		const forward = rotate(sequence(N.C4(1), N.E4(1), N.G4(1)), 2);
		const backward = rotate(sequence(N.C4(1), N.E4(1), N.G4(1)), -1);
		expect(collectNotes(forward).map((positionedNote) => pitchKey(positionedNote.pitch))).toEqual(
			collectNotes(backward).map((positionedNote) => pitchKey(positionedNote.pitch)),
		);
	});

	it("returns empty for empty child", () => {
		expect(collectNotes(rotate(sequence(), 1))).toEqual([]);
	});
});
