import { describe, expect, it } from "vitest";
import { gap } from "../gap";
import { layer } from "../layer";
import { metadata } from "../metadata";
import { note } from "../note";
import { repeat } from "../repeat";
import { sequence } from "../sequence";
import { childrenOf, flatMapTree } from "./tree";

describe("childrenOf", () => {
	it("returns empty for leaf pattern", () => {
		expect(childrenOf(note("C4", 1), 0)).toEqual([]);
	});

	it("returns single child for metadata wrapper", () => {
		const child = note("C4", 1);
		const wrapped = metadata(child, { name: "test" });
		const children = childrenOf(wrapped, 4);
		expect(children).toHaveLength(1);
		expect(children[0].pattern).toBe(child);
		expect(children[0].offsetBeats).toBe(4);
	});

	it("returns sequence children with accumulated offsets", () => {
		const first = gap(2);
		const second = gap(3);
		const third = gap(1);
		const seq = sequence(first, second, third);
		const children = childrenOf(seq, 10);
		expect(children).toHaveLength(3);
		expect(children[0].offsetBeats).toBe(10);
		expect(children[1].offsetBeats).toBe(12);
		expect(children[2].offsetBeats).toBe(15);
	});

	it("returns layer children with same offset", () => {
		const first = note("C4", 4);
		const second = note("E4", 4);
		const lay = layer(first, second);
		const children = childrenOf(lay, 8);
		expect(children).toHaveLength(2);
		expect(children[0].offsetBeats).toBe(8);
		expect(children[1].offsetBeats).toBe(8);
	});

	it("returns repeat children with multiplied offsets", () => {
		const child = gap(4);
		const rep = repeat(child, 3);
		const children = childrenOf(rep, 0);
		expect(children).toHaveLength(3);
		expect(children[0].offsetBeats).toBe(0);
		expect(children[1].offsetBeats).toBe(4);
		expect(children[2].offsetBeats).toBe(8);
	});
});

describe("flatMapTree", () => {
	it("visits leaf node", () => {
		const leaf = note("C4", 1);
		const result = flatMapTree(leaf, (pattern, offset) => [{ type: pattern.type, offset }]);
		expect(result).toEqual([{ type: "note", offset: 0 }]);
	});

	it("visits metadata wrapper and child", () => {
		const wrapped = metadata(note("C4", 1), { name: "test" });
		const types = flatMapTree(wrapped, (pattern) => [pattern.type]);
		expect(types).toEqual(["metadata", "note"]);
	});

	it("visits sequence children with correct offsets", () => {
		const seq = sequence(gap(2), gap(3), gap(1));
		const result = flatMapTree(seq, (pattern, offset) => {
			if (pattern.type === "gap") return [offset];
			return [];
		});
		expect(result).toEqual([0, 2, 5]);
	});

	it("visits layer children with same offset", () => {
		const lay = layer(note("C4", 4), note("E4", 4));
		const result = flatMapTree(lay, (pattern, offset) => {
			if (pattern.type === "note") return [offset];
			return [];
		});
		expect(result).toEqual([0, 0]);
	});

	it("visits repeat children with correct offsets", () => {
		const rep = repeat(gap(4), 3);
		const result = flatMapTree(rep, (pattern, offset) => {
			if (pattern.type === "gap") return [offset];
			return [];
		});
		expect(result).toEqual([0, 4, 8]);
	});

	it("collects from nested tree", () => {
		const tree = sequence(metadata(note("C4", 2), { name: "first" }), layer(note("E4", 2), note("G4", 2)));
		const result = flatMapTree(tree, (pattern, offset) => {
			if (pattern.type === "note") return [offset];
			return [];
		});
		expect(result).toEqual([0, 2, 2]);
	});

	it("handles repeat inside sequence", () => {
		const tree = sequence(gap(4), repeat(gap(2), 3));
		const result = flatMapTree(tree, (pattern, offset) => {
			if (pattern.type === "gap" && pattern.durationBeats === 2) return [offset];
			return [];
		});
		expect(result).toEqual([4, 6, 8]);
	});

	it("returns empty for visitor that produces nothing", () => {
		const tree = sequence(note("C4", 1), note("D4", 1));
		const result = flatMapTree(tree, () => []);
		expect(result).toEqual([]);
	});

	it("collects multiple results per node", () => {
		const leaf = note("C4", 4);
		const result = flatMapTree(leaf, (pattern) => [pattern.type, pattern.type]);
		expect(result).toEqual(["note", "note"]);
	});
});
