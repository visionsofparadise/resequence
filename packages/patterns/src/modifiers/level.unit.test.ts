import { level, humanize } from "./level";
import { sequence, N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("level", () => {
	it("sets velocity to fixed value", () => {
		const tree = sequence(N.C4(1), N.E4(1));
		const result = level(tree, { velocity: 80 });
		const notes = collectNotes(result);
		for (const n of notes) {
			expect(n.note.velocity).toBe(80);
		}
	});
});

describe("humanize", () => {
	it("produces deterministic output with seed", () => {
		const tree = sequence(N.C4(1), N.E4(1));
		const r1 = humanize(tree, 10, 42);
		const r2 = humanize(tree, 10, 42);
		const n1 = collectNotes(r1);
		const n2 = collectNotes(r2);
		expect(n1[0]!.note.velocity).toBe(n2[0]!.note.velocity);
	});
});
