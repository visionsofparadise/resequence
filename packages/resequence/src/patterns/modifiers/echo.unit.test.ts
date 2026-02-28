import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { collectNotes } from "../utils/tree";
import { echo } from "./echo";

describe("echo", () => {
	it("adds the specified number of echo copies", () => {
		const pat = echo(N.C4(1), 1, 2, 0.5);
		expect(collectNotes(pat)).toHaveLength(3);
	});

	it("applies decay to echo velocity", () => {
		const pat = echo(N.C4(1, { velocity: 100 }), 1, 2, 0.5);
		const notes = collectNotes(pat);
		expect(notes[0]!.velocity).toBe(100);
		expect(notes[1]!.velocity).toBe(50);
		expect(notes[2]!.velocity).toBe(25);
	});

	it("clamps echo velocity to minimum 1", () => {
		const pat = echo(N.C4(1, { velocity: 1 }), 1, 1, 0.1);
		expect(collectNotes(pat)[1]!.velocity).toBe(1);
	});
});
