import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { slice, trim } from "./slice";

describe("slice", () => {
	it("keeps notes at the specified index range", () => {
		const pat = slice(sequence(N.C4(1), N.E4(1), N.G4(1)), 1, 3);
		expect(collectNotes(pat)).toHaveLength(2);
		expect(collectNotes(pat)[0]!.pitch).toEqual(N.E4);
		expect(collectNotes(pat)[1]!.pitch).toEqual(N.G4);
	});

	it("shifts beats so the first kept note starts at zero", () => {
		const pat = slice(sequence(N.C4(1), N.E4(1), N.G4(1)), 1, 3);
		expect(collectNotes(pat)[0]!.startBeat).toBe(0);
		expect(collectNotes(pat)[1]!.startBeat).toBe(1);
	});

	it("returns empty notes and zero duration when range is empty", () => {
		const pat = slice(N.C4(1), 5, 10);
		expect(collectNotes(pat)).toHaveLength(0);
		expect(pat.endBeat - pat.startBeat).toBe(0);
	});
});

describe("trim", () => {
	it("keeps notes within the time window", () => {
		const pat = trim(sequence(N.C4(1), N.E4(1), N.G4(1)), 1, 2);
		expect(collectNotes(pat)).toHaveLength(1);
		expect(collectNotes(pat)[0]!.pitch).toEqual(N.E4);
	});

	it("clips notes that span the window boundary", () => {
		const pat = trim(N.C4(1), 0.5, 1);
		expect(collectNotes(pat)).toHaveLength(1);
		expect(collectNotes(pat)[0]).toMatchObject({ startBeat: 0, endBeat: 0.5 });
	});
});
