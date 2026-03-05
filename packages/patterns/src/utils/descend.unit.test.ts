import { describe, expect, it } from "vitest";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { descendAndClone } from "./descend";

describe("descendAndClone", () => {
	it("modifies target and clones path", () => {
		const a = sequence(N.C4(1));
		const b = sequence(N.E4(1));
		const tree = sequence(a, b);

		const result = descendAndClone(tree, [1], (target) =>
			target.clone({ notes: target.notes.map((rn) => ({ ...rn, note: { ...rn.note, velocity: 127 } })) }),
		);

		expect(result).not.toBe(tree);
		expect(result.children[0]?.pattern).toBe(a); // sibling unchanged
		expect(result.children[1]?.pattern).not.toBe(b); // target changed

		const modifiedB = result.children[1]?.pattern;
		expect(modifiedB?.notes[0]?.note.velocity).toBe(127);
	});

	it("handles root-level operation", () => {
		const tree = sequence(N.C4(1));
		const result = descendAndClone(tree, [], (target) => target.clone({ endBeat: 10 }));
		expect(result.endBeat).toBe(10);
	});
});
