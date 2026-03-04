import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { gap } from "../gap";
import { layer } from "../layer";
import { repeat } from "../modifiers/repeat";
import { sequence } from "../sequence";
import { collectNotes, descendAndClone, mapNotes, flatMapNotes, mapNoteGroups } from "./tree";

describe("collectNotes", () => {
	it("returns empty for gap", () => {
		expect(collectNotes(gap(2))).toEqual([]);
	});

	it("collects notes from sequence with correct offsets", () => {
		const seq = sequence(
			N.C4(1),
			N.D4(1),
			N.E4(1),
		);
		const notes = collectNotes(seq);
		expect(notes).toHaveLength(3);
		expect(notes[0]).toMatchObject({ startBeat: 0, pitch: N.C4 });
		expect(notes[1]).toMatchObject({ startBeat: 1, pitch: N.D4 });
		expect(notes[2]).toMatchObject({ startBeat: 2, pitch: N.E4 });
	});

	it("collects notes from layer at same offset", () => {
		const lay = layer(
			sequence(N.C4(4)),
			sequence(N.E4(4)),
		);
		const notes = collectNotes(lay);
		expect(notes).toHaveLength(2);
		expect(notes[0]?.startBeat).toBe(0);
		expect(notes[1]?.startBeat).toBe(0);
	});

	it("collects notes from repeat with correct offsets", () => {
		const rep = repeat(sequence(N.C4(1)), 3);
		const notes = collectNotes(rep);
		expect(notes).toHaveLength(3);
		expect(notes[0]?.startBeat).toBe(0);
		expect(notes[1]?.startBeat).toBe(1);
		expect(notes[2]?.startBeat).toBe(2);
	});

	it("collects from nested tree", () => {
		const tree = sequence(
			repeat(sequence(N.C4(1)), 2),
			layer(sequence(N.E4(2)), sequence(N.G4(2))),
		);
		const notes = collectNotes(tree);
		expect(notes).toHaveLength(4);
		expect(notes[0]?.startBeat).toBe(0);
		expect(notes[1]?.startBeat).toBe(1);
		expect(notes[2]?.startBeat).toBe(2);
		expect(notes[3]?.startBeat).toBe(2);
	});
});

describe("mapNotes", () => {
	it("transforms notes in place", () => {
		const seq = sequence(N.C4(1), N.D4(1));
		const mapped = mapNotes(seq, (n) => ({ ...n, velocity: 50 }));
		const notes = collectNotes(mapped);
		expect(notes[0]?.velocity).toBe(50);
		expect(notes[1]?.velocity).toBe(50);
	});

	it("preserves structure when no changes", () => {
		const seq = sequence(N.C4(1));
		const mapped = mapNotes(seq, (n) => n);
		expect(mapped).toBe(seq);
	});

	it("provides absolute offset to callback", () => {
		const seq = sequence(N.C4(2), N.D4(2));
		const offsets: number[] = [];
		mapNotes(seq, (n, { absoluteOffset }) => {
			offsets.push(absoluteOffset);
			return n;
		});
		expect(offsets).toEqual([0, 2]);
	});
});

describe("flatMapNotes", () => {
	it("can duplicate notes", () => {
		const seq = sequence(N.C4(1));
		const mapped = flatMapNotes(seq, (n) => [n, { ...n, velocity: 50 }]);
		const notes = collectNotes(mapped);
		expect(notes).toHaveLength(2);
	});

	it("can filter out notes", () => {
		const seq = sequence(N.C4(1), N.D4(1));
		const mapped = flatMapNotes(seq, (n) => (n.pitch.class === N.C4.class ? [n] : []));
		const notes = collectNotes(mapped);
		expect(notes).toHaveLength(1);
	});
});

describe("descendAndClone", () => {
	it("applies operation at root when indexes empty", () => {
		const seq = sequence(N.C4(1));
		const result = descendAndClone(seq, [], (node) =>
			node.clone({ notes: node.notes.map((n) => ({ ...n, note: { ...n.note, velocity: 42 } })) }),
		);
		const notes = collectNotes(result);
		expect(notes[0]?.velocity).toBe(42);
	});

	it("navigates to nested child and applies operation", () => {
		const inner = sequence(N.C4(1));
		const mid = sequence(inner, gap(1));
		const outer = sequence(mid, gap(1));
		const result = descendAndClone(outer, [0, 0], (node) =>
			node.clone({ notes: node.notes.map((n) => ({ ...n, note: { ...n.note, velocity: 77 } })) }),
		);
		const notes = collectNotes(result);
		expect(notes[0]?.velocity).toBe(77);
	});

	it("preserves structural sharing for unmodified branches", () => {
		const a = sequence(N.C4(1));
		const b = sequence(N.D4(1));
		const root = layer(a, b);
		const result = descendAndClone(root, [0], (node) =>
			node.clone({ notes: node.notes.map((n) => ({ ...n, note: { ...n.note, velocity: 50 } })) }),
		);
		expect(result.children[1]?.pattern).toBe(b);
		expect(result.children[0]?.pattern).not.toBe(a);
	});

	it("throws on out-of-bounds index", () => {
		const seq = sequence(N.C4(1));
		expect(() => descendAndClone(seq, [5], (n) => n)).toThrow("out of bounds");
	});
});

describe("mapNoteGroups", () => {
	it("receives all notes at a tree node", () => {
		const seq = sequence(N.C4(1), N.D4(1));
		const groupSizes: number[] = [];
		mapNoteGroups(seq, (notes, _offset) => {
			groupSizes.push(notes.length);
			return notes;
		});
		expect(groupSizes).toContain(2);
	});
});
