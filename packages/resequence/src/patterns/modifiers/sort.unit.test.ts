import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { sort } from "./sort";

describe("SortPattern", () => {
	it("sorts pitches ascending by default", () => {
		const pat = sort(
			sequence(N.E4(1), N.C4(1), N.G4(1)),
		);
		expect(collectNotes(pat)[0]!.pitch).toEqual(N.C4);
		expect(collectNotes(pat)[1]!.pitch).toEqual(N.E4);
		expect(collectNotes(pat)[2]!.pitch).toEqual(N.G4);
	});

	it("sorts pitches descending when key is desc", () => {
		const pat = sort(sequence(N.C4(1), N.E4(1), N.G4(1)), "desc");
		expect(collectNotes(pat)[0]!.pitch).toEqual(N.G4);
		expect(collectNotes(pat)[1]!.pitch).toEqual(N.E4);
		expect(collectNotes(pat)[2]!.pitch).toEqual(N.C4);
	});
});
