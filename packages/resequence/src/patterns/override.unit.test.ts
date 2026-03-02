import { describe, expect, it } from "vitest";
import { pitchKey } from "../utils/pitch";
import { N } from "../tunings/chromatic";
import { layer } from "./layer";
import { override } from "./override";
import { sequence } from "./sequence";
import { collectNotes } from "./utils/tree";

describe("override", () => {
	it("overrides a note velocity via callback", () => {
		const melody = sequence(N.C4(1), N.D4(1));
		const patched = override(melody, [], (props) => ({
			notes: props.notes.map((entry, index) =>
				index === 0 ? { ...entry, note: { ...entry.note, velocity: 127 } } : entry,
			),
		}));
		const notes = collectNotes(patched);
		expect(notes[0]?.velocity).toBe(127);
		expect(notes[1]?.velocity).toBe(100);
	});

	it("removes a note", () => {
		const melody = sequence(N.C4(1), N.D4(1), N.E4(1));
		const patched = override(melody, [], (props) => ({
			notes: props.notes.filter((_, index) => index !== 1),
		}));
		const notes = collectNotes(patched);
		expect(notes).toHaveLength(2);
		expect(pitchKey(notes[0]!.pitch)).toBe(pitchKey(N.C4));
		expect(pitchKey(notes[1]!.pitch)).toBe(pitchKey(N.E4));
	});

	it("navigates to a child via indexes", () => {
		const track1 = sequence(N.C4(1));
		const track2 = sequence(N.E4(1));
		const song = layer(track1, track2);
		const patched = override(song, [0], (props) => ({
			notes: props.notes.map((entry) => ({
				...entry,
				note: { ...entry.note, velocity: 42 },
			})),
		}));
		const notes = collectNotes(patched);
		expect(notes[0]?.velocity).toBe(42);
		expect(notes[1]?.velocity).toBe(100);
	});

	it("stores original pattern, indexes, and callback", () => {
		const melody = sequence(N.C4(1));
		const cb = () => ({});
		const patched = override(melody, [], cb);
		expect(patched.properties.input).toBe(melody);
		expect(patched.properties.indexes).toEqual([]);
		expect(patched.properties.callback).toBe(cb);
	});
});
