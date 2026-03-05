import { describe, expect, it } from "vitest";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { flatMapNotes, mapNotes, mapPatterns } from "./map";

describe("mapPatterns", () => {
	it("returns same reference when no changes", () => {
		const tree = sequence(N.C4(1), N.E4(1));
		const result = mapPatterns(tree, (pattern) => pattern);
		expect(result).toBe(tree);
	});
});

describe("mapNotes", () => {
	it("transforms notes", () => {
		const tree = sequence(N.C4(1), N.E4(1)).route("piano");
		const result = mapNotes(tree, (n) => ({ ...n, velocity: 127 }));

		const events = result.schedule(0, -Infinity, Infinity, [{ key: "piano", channel: 0 }]);
		for (const ev of events) {
			if (ev.type === "note") {
				expect(ev.velocity).toBe(127);
			}
		}
	});

	it("preserves structural sharing when no change", () => {
		const tree = sequence(N.C4(1));
		const result = mapNotes(tree, (n) => n);
		expect(result).toBe(tree);
	});
});

describe("flatMapNotes", () => {
	it("removes notes with empty return", () => {
		const tree = sequence(N.C4(1), N.E4(1));
		const result = flatMapNotes(tree, (n) => (n.pitch.class === 0 ? [] : [n]));
		expect(result.notes).toHaveLength(1);
	});

	it("expands notes", () => {
		const tree = sequence(N.C4(1));
		const result = flatMapNotes(tree, (n) => [n, { ...n, velocity: 50 }]);
		expect(result.notes).toHaveLength(2);
	});
});
