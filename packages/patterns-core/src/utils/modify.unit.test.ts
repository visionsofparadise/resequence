import { describe, expect, it } from "vitest";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { flatModifyNotes, modifyNotes, modifyPatterns } from "./modify";

describe("modifyPatterns", () => {
	it("mutates patterns in place", () => {
		const tree = sequence(N.C4(1), N.E4(1));
		modifyPatterns(tree, () => {});
		expect(tree.notes).toHaveLength(2);
	});
});

describe("modifyNotes", () => {
	it("transforms notes in place", () => {
		const tree = sequence(N.C4(1), N.E4(1)).route("piano");
		modifyNotes(tree, (n) => ({ ...n, velocity: 127 }));

		const events = tree.schedule(0, -Infinity, Infinity, [{ key: "piano", channel: 0 }]);
		for (const ev of events) {
			if (ev.type === "note") {
				expect(ev.velocity).toBe(127);
			}
		}
	});

	it("modifies the same pattern instance", () => {
		const tree = sequence(N.C4(1));
		modifyNotes(tree, (n) => ({ ...n, velocity: 100 }));
		expect(tree.notes).toHaveLength(1);
	});
});

describe("flatModifyNotes", () => {
	it("removes notes with empty return", () => {
		const tree = sequence(N.C4(1), N.E4(1));
		flatModifyNotes(tree, (n) => (n.pitch.class === 0 ? [] : [n]));
		expect(tree.notes).toHaveLength(1);
	});

	it("expands notes", () => {
		const tree = sequence(N.C4(1));
		flatModifyNotes(tree, (n) => [n, { ...n, velocity: 50 }]);
		expect(tree.notes).toHaveLength(2);
	});
});
