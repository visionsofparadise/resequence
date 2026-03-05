import { describe, expect, it } from "vitest";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { collectNotes } from "../utils/walk";
import { override } from "./override";
import { revert } from "./revert";

describe("revert", () => {
	it("restores pre-modification state", () => {
		const tree = sequence(N.C4(1));
		const overridden = override(tree, [], (props) => ({
			...props,
			notes: props.notes.map((rn) => ({ ...rn, note: { ...rn.note, velocity: 50 } })),
		}));
		// The overridden root has previousProperties from the clone in descendAndClone
		const reverted = revert(overridden, [], 1);
		const notes = collectNotes(reverted);
		expect(notes[0]!.note.velocity).toBe(100); // original velocity restored
	});
});
