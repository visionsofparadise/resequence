import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { reverse } from "./reverse";

describe("ReversePattern", () => {
	it("reverses note order in time", () => {
		const pat = reverse(sequence(N.C4(1), N.E4(1), N.G4(1)));
		const notes = collectNotes(pat).slice().sort((a, b) => a.startBeat - b.startBeat);
		expect(notes).toMatchObject([
			{ startBeat: 0, pitch: N.G4 },
			{ startBeat: 1, pitch: N.E4 },
			{ startBeat: 2, pitch: N.C4 },
		]);
	});

	it("returns empty for empty child", () => {
		expect(collectNotes(reverse(sequence()))).toEqual([]);
	});
});
