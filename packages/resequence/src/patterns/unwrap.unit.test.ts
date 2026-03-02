import { describe, expect, it } from "vitest";
import { pitchKey } from "../utils/pitch";
import { N } from "../tunings/chromatic";
import { transpose } from "./modifiers/transpose";
import { sequence } from "./sequence";
import { unwrap } from "./unwrap";
import { collectNotes } from "./utils/tree";

describe("unwrap", () => {
	it("recovers original untransformed pattern", () => {
		const melody = sequence(N.C4(1), N.D4(1));
		const transposed = transpose(melody, 7);
		const unwrapped = unwrap(transposed);
		const notes = collectNotes(unwrapped);
		expect(pitchKey(notes[0]!.pitch)).toBe(pitchKey(N.C4));
		expect(pitchKey(notes[1]!.pitch)).toBe(pitchKey(N.D4));
	});

	it("stores the modifier as input", () => {
		const melody = sequence(N.C4(1));
		const transposed = transpose(melody, 7);
		const unwrapped = unwrap(transposed);
		expect(unwrapped.properties.input).toBe(transposed);
	});

	it("preserves duration of original", () => {
		const melody = sequence(N.C4(2), N.D4(2));
		const transposed = transpose(melody, 3);
		const unwrapped = unwrap(transposed);
		expect(unwrapped.startBeat).toBe(melody.startBeat);
		expect(unwrapped.endBeat).toBe(melody.endBeat);
	});
});
