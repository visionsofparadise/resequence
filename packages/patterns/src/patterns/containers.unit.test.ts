import { describe, expect, it } from "vitest";
import type { NoteEvent } from "../events";
import { note } from "../note";
import { N } from "../tunings/chromatic";
import { layer } from "./layer";
import { sequence, toPattern } from "./sequence";

describe("sequence", () => {
	it("places notes sequentially", () => {
		const seq = sequence(N.C4(1), N.E4(1), N.G4(1));
		expect(seq.startBeat).toBe(0);
		expect(seq.endBeat).toBe(3);
		expect(seq.notes).toHaveLength(3);
		expect(seq.notes[0]?.offsetBeats).toBe(0);
		expect(seq.notes[1]?.offsetBeats).toBe(1);
		expect(seq.notes[2]?.offsetBeats).toBe(2);
	});

	it("places patterns sequentially", () => {
		const a = sequence(N.C4(2));
		const b = sequence(N.E4(1));
		const combined = sequence(a, b);

		expect(combined.endBeat).toBe(3);
		expect(combined.children).toHaveLength(2);
		expect(combined.children[0]?.offsetBeats).toBe(0);
		expect(combined.children[1]?.offsetBeats).toBe(2);
	});

	it("mixes notes and patterns", () => {
		const pat = sequence(N.C4(1));
		const combined = sequence(N.E4(1), pat, N.G4(1));

		expect(combined.endBeat).toBe(3);
		expect(combined.notes).toHaveLength(2);
		expect(combined.children).toHaveLength(1);
	});

	it("generates correct NoteEvents with routing", () => {
		const seq = sequence(N.C4(1), N.E4(2)).route("piano");
		const events = seq.schedule(0, -Infinity, Infinity) as Array<NoteEvent>;

		expect(events).toHaveLength(2);
		expect(events[0]?.startBeat).toBe(0);
		expect(events[0]?.durationBeats).toBe(1);
		expect(events[1]?.startBeat).toBe(1);
		expect(events[1]?.durationBeats).toBe(2);
	});
});

describe("layer", () => {
	it("places notes simultaneously", () => {
		const lay = layer(N.C4(2), N.E4(1));
		expect(lay.startBeat).toBe(0);
		expect(lay.endBeat).toBe(2);
		expect(lay.notes).toHaveLength(2);
		expect(lay.notes[0]?.offsetBeats).toBe(0);
		expect(lay.notes[1]?.offsetBeats).toBe(0);
	});

	it("places patterns simultaneously", () => {
		const a = sequence(N.C4(2));
		const b = sequence(N.E4(3));
		const combined = layer(a, b);

		expect(combined.endBeat).toBe(3);
		expect(combined.children).toHaveLength(2);
	});

	it("generates correct NoteEvents with routing", () => {
		const lay = layer(N.C4(2), N.E4(1)).route("strings");
		const events = lay.schedule(0, -Infinity, Infinity) as Array<NoteEvent>;

		expect(events).toHaveLength(2);
		expect(events[0]?.startBeat).toBe(0);
		expect(events[1]?.startBeat).toBe(0);
	});
});

describe("nested containers", () => {
	it("sequence of layers", () => {
		const chord1 = layer(N.C4(1), N.E4(1), N.G4(1));
		const chord2 = layer(N.F4(1), N.A4(1), N.C5(1));
		const progression = sequence(chord1, chord2).route("piano");

		const events = progression.schedule(0, -Infinity, Infinity) as Array<NoteEvent>;
		expect(events).toHaveLength(6);

		const beats = events.map((ev) => ev.startBeat);
		expect(beats.filter((b) => b === 0)).toHaveLength(3);
		expect(beats.filter((b) => b === 1)).toHaveLength(3);
	});

	it("layer of sequences", () => {
		const melody = sequence(N.C4(1), N.E4(1));
		const bass = sequence(N.C3(2));
		const combined = layer(melody, bass).route("piano");

		const events = combined.schedule(0, -Infinity, Infinity) as Array<NoteEvent>;
		expect(events).toHaveLength(3);
	});
});

describe("toPattern", () => {
	it("returns pattern as-is", () => {
		const pat = sequence(N.C4(1));
		expect(toPattern(pat)).toBe(pat);
	});

	it("wraps note in sequence", () => {
		const n = note(N.C4, 1);
		const pat = toPattern(n);
		expect(pat.endBeat).toBe(1);
		expect(pat.notes).toHaveLength(1);
	});
});
