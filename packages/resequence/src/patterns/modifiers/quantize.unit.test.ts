import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { gap } from "../gap";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { quantize, shuffle } from "./quantize";

describe("QuantizePattern", () => {
	it("snaps notes to nearest subdivision grid", () => {
		const pat = quantize(sequence(N.C4(250), N.E4(240), N.G4(240)), 480);
		expect(collectNotes(pat)[0]?.startBeat).toBe(0);
	});

	it("snaps halfway point down to lower grid line", () => {
		const pat = quantize(
			sequence(gap(0.5), N.C4(1)),
			1,
		);
		expect(collectNotes(pat)[0]?.startBeat).toBe(0);
	});

	it("snaps to grooved positions", () => {
		const src = sequence(N.C4(1), N.E4(1));
		const pat = shuffle(src, 0.67);
		expect(collectNotes(pat)[0]?.startBeat).toBe(0);
		expect(collectNotes(pat)[1]?.startBeat).toBe(1);
	});

	it("produces swung timing on straight 8th notes", () => {
		const eights = sequence(N.C4(0.5), N.D4(0.5), N.E4(0.5), N.F4(0.5));
		const swung = shuffle(eights, 0.67);
		const notes = collectNotes(swung);
		expect(notes[0]?.startBeat).toBe(0);
		expect(notes[2]?.startBeat).toBe(1);
		expect(notes[1]?.startBeat).toBeGreaterThan(0.5);
		expect(notes[3]?.startBeat).toBeGreaterThan(1.5);
	});
});
