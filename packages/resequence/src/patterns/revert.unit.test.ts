import { describe, expect, it } from "vitest";
import { pitchKey } from "../utils/pitch";
import { N } from "../tunings/chromatic";
import { layer } from "./layer";
import { reverse } from "./modifiers/reverse";
import { transpose } from "./modifiers/transpose";
import { revert } from "./revert";
import { sequence } from "./sequence";
import { collectNotes } from "./utils/tree";

describe("revert", () => {
	it("reverts one step to pre-transpose state on a targeted child", () => {
		const melody = sequence(N.C4(1), N.D4(1));
		const song = layer(melody);
		const transposed = transpose(song, 7);
		const reverted = revert(transposed, [0], 1);
		const notes = collectNotes(reverted);
		expect(pitchKey(notes[0]!.pitch)).toBe(pitchKey(N.C4));
		expect(pitchKey(notes[1]!.pitch)).toBe(pitchKey(N.D4));
	});

	it("reverts two steps through stacked modifiers", () => {
		const melody = sequence(N.C4(1), N.D4(1));
		const song = layer(melody);
		const reversed = reverse(song);
		const transposed = transpose(reversed, 7);
		const reverted = revert(transposed, [0], 2);
		const notes = collectNotes(reverted);
		expect(pitchKey(notes[0]!.pitch)).toBe(pitchKey(N.C4));
		expect(pitchKey(notes[1]!.pitch)).toBe(pitchKey(N.D4));
	});

	it("stops at root when steps exceed previousProperties depth", () => {
		const melody = sequence(N.C4(1));
		const song = layer(melody);
		const transposed = transpose(song, 7);
		const reverted = revert(transposed, [0], 100);
		const notes = collectNotes(reverted);
		expect(pitchKey(notes[0]!.pitch)).toBe(pitchKey(N.C4));
	});

	it("only reverts targeted child, leaving siblings untouched", () => {
		const track1 = sequence(N.C4(1));
		const track2 = sequence(N.E4(1));
		const song = layer(track1, track2);
		const transposed = transpose(song, 7);
		const reverted = revert(transposed, [0], 1);
		const notes = collectNotes(reverted);
		// track1 reverted to C4, track2 still transposed (E4+7 = B4)
		expect(pitchKey(notes[0]!.pitch)).toBe(pitchKey(N.C4));
		expect(pitchKey(notes[1]!.pitch)).toBe(pitchKey(N.B4));
	});

	it("stores original pattern, indexes, and steps", () => {
		const melody = sequence(N.C4(1));
		const song = layer(melody);
		const transposed = transpose(song, 7);
		const reverted = revert(transposed, [0], 1);
		expect(reverted.properties.input).toBe(transposed);
		expect(reverted.properties.indexes).toEqual([0]);
		expect(reverted.properties.steps).toBe(1);
	});
});
