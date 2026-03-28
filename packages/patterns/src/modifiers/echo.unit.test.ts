import { echo } from "./echo";
import { N, collectNotes } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
describe("echo", () => {
	it("produces original + delayed copies", () => {
		const result = echo(N.C4(1), 0.5, 2, 0.5);
		const notes = collectNotes(result);
		expect(notes).toHaveLength(3); // original + 2 echoes
	});

	it("decays velocity", () => {
		const result = echo(N.C4(1), 0.5, 2, 0.5);
		const notes = collectNotes(result);
		const sorted = notes.sort((a, b) => (a.absoluteBeat + a.note.startBeat) - (b.absoluteBeat + b.note.startBeat));
		expect(sorted[1]!.note.velocity).toBe(50); // 100 * 0.5
		expect(sorted[2]!.note.velocity).toBe(25); // 100 * 0.5^2
	});
});
