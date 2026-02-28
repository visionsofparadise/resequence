import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { gap } from "../gap";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { gate } from "./gate";

describe("gate", () => {
	it("passes note through unchanged when gate fully covers it", () => {
		const pat = gate(N.C4(1), sequence(N.E4(1)));
		const notes = collectNotes(pat);
		expect(notes).toHaveLength(1);
		expect(notes[0]).toMatchObject({ startBeat: 0, pitch: N.C4, endBeat: 1 });
	});

	it("trims note to the gate window when gate is shorter", () => {
		const pat = gate(N.C4(1), sequence(N.E4(0.25)));
		const notes = collectNotes(pat);
		expect(notes).toHaveLength(1);
		expect(notes[0]).toMatchObject({ startBeat: 0, endBeat: 0.25 });
	});

	it("emits nothing when note has zero duration", () => {
		const pat = gate(N.C4(0), sequence(N.E4(1)));
		expect(collectNotes(pat)).toHaveLength(0);
	});

	it("emits one fragment per overlapping gate window", () => {
		const pat = gate(N.C4(2), sequence(N.E4(0.25), gap(0.5), N.F4(0.25)));
		const notes = collectNotes(pat);
		expect(notes).toHaveLength(2);
		expect(notes[0]).toMatchObject({ startBeat: 0, endBeat: 0.25 });
		expect(notes[1]).toMatchObject({ startBeat: 0.75, endBeat: 1 });
	});
});
