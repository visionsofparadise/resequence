import { describe, expect, it } from "vitest";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { override } from "./override";

describe("override", () => {
	it("modifies target node properties", () => {
		const child = sequence(N.C4(1));
		const tree = sequence(child, sequence(N.E4(1)));
		const result = override(tree, [0], (props) => ({
			...props,
			notes: props.notes.map((rn) => ({ ...rn, note: { ...rn.note, velocity: 50 } })),
		}));
		const notes = collectNotes(result);
		const sorted = notes.sort((a, b) => (a.absoluteBeat + a.note.startBeat) - (b.absoluteBeat + b.note.startBeat));
		expect(sorted[0]!.note.velocity).toBe(50);
		expect(sorted[1]!.note.velocity).toBe(100); // unchanged
	});
});
