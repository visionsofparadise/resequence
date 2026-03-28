import { describe, expect, it } from "vitest";
import { layer } from "../patterns/layer";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { collectNotes, walkNotes, walkPatterns } from "./walk";

describe("walkPatterns", () => {
	it("visits all nodes with correct offsets", () => {
		const a = sequence(N.C4(1));
		const b = sequence(N.E4(1));
		const tree = sequence(a, b);

		const visited: Array<{ beat: number }> = [];
		walkPatterns(tree, (_pattern, absoluteBeat) => {
			visited.push({ beat: absoluteBeat });
		});

		expect(visited).toHaveLength(3);
		expect(visited[0]?.beat).toBe(0); // root
		expect(visited[1]?.beat).toBe(0); // a
		expect(visited[2]?.beat).toBe(1); // b
	});
});

describe("walkNotes", () => {
	it("visits all notes with correct absolute positions", () => {
		const tree = sequence(N.C4(1), N.E4(1));
		const visited: Array<{ beat: number; id: string }> = [];
		walkNotes(tree, (_note, { absoluteOffset, id }) => {
			visited.push({ beat: absoluteOffset, id });
		});

		expect(visited).toHaveLength(2);
		expect(visited[0]?.beat).toBe(0);
		expect(visited[1]?.beat).toBe(1);
	});

	it("provides stable note ids for correlation", () => {
		const tree = sequence(N.C4(1), N.E4(1));
		const ids1: Array<string> = [];
		const ids2: Array<string> = [];
		walkNotes(tree, (_note, { id }) => ids1.push(id));
		walkNotes(tree, (_note, { id }) => ids2.push(id));

		expect(ids1).toEqual(ids2);
		expect(ids1[0]).not.toBe(ids1[1]);
	});

	it("builds nested ids for child patterns", () => {
		const a = sequence(N.C4(1));
		const b = sequence(N.E4(1));
		const tree = sequence(a, b);

		const ids: Array<string> = [];
		walkNotes(tree, (_note, { id }) => ids.push(id));

		expect(ids).toHaveLength(2);
		expect(ids[0]).toBe("0-n0"); // first child, first note
		expect(ids[1]).toBe("1-n0"); // second child, first note
	});
});

describe("collectNotes", () => {
	it("collects all notes with absolute positions", () => {
		const tree = sequence(layer(N.C4(1), N.E4(1)), N.G4(1));
		const collected = collectNotes(tree);

		expect(collected).toHaveLength(3);
		// Root note G4 visited first (at root level), then layer children
		const beats = collected.map((c) => c.absoluteBeat).sort();
		expect(beats).toEqual([0, 0, 1]);
	});
});
