import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { gap } from "../gap";
import { layer } from "../layer";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { polyphony } from "./polyphony";

describe("PolyphonyPattern", () => {
	it("allows notes up to the max simultaneously", () => {
		const pat = polyphony(layer(sequence(N.C4(1)), sequence(N.E4(1))), 2);
		expect(collectNotes(pat)).toHaveLength(2);
	});

	it("drops notes exceeding max in non-greedy mode", () => {
		const pat = polyphony(layer(sequence(N.C4(1)), sequence(N.E4(1))), 1);
		expect(collectNotes(pat)).toHaveLength(1);
	});

	it("in greedy mode replaces oldest active note with incoming note", () => {
		const pat = polyphony(layer(sequence(N.C4(1)), sequence(N.E4(1))), 1, true);
		expect(collectNotes(pat)).toHaveLength(1);
		expect(collectNotes(pat)[0]!.pitch).toEqual(N.E4);
	});

	it("does not drop notes that do not overlap in time", () => {
		const pat = polyphony(sequence(N.C4(240), gap(240), N.E4(1)), 1);
		expect(collectNotes(pat)).toHaveLength(2);
	});
});
