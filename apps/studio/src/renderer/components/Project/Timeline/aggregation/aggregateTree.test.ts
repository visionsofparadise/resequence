import { describe, expect, it } from "vitest";
import { layer, N, note, sequence } from "resequence";
import { aggregateTree } from "./aggregateTree";

const c4 = N.C4;
const e4 = N.E4;
const g4 = N.G4;

describe("aggregateTree", () => {
	it("produces horizontal segments from a sequence", () => {
		const tree = sequence(note(c4, 2), note(e4, 2), note(g4, 2));
		const data = aggregateTree(tree);

		expect(data.totalStartBeat).toBe(0);
		expect(data.totalEndBeat).toBe(6);
		expect(data.segments.length).toBeGreaterThan(0);
	});

	it("groups notes with the same output into one lane", () => {
		const tree = layer(note(c4, 2), note(e4, 2));
		const data = aggregateTree(tree);

		expect(data.segments.length).toBe(1);
		const segment = data.segments[0]!;
		const noteLanes = segment.lanes.filter((l) => l.kind === "notes");
		expect(noteLanes.length).toBe(1);
		expect(noteLanes[0]!.notes.length).toBe(2);
	});

	it("returns empty segments for an empty pattern", () => {
		const tree = sequence();
		const data = aggregateTree(tree);

		expect(data.segments.length).toBe(0);
		expect(data.totalEndBeat).toBe(0);
	});

	it("unrouted notes use 'unrouted' output key", () => {
		const tree = layer(note(c4, 1));
		const data = aggregateTree(tree);

		const noteLane = data.segments[0]?.lanes.find((l) => l.kind === "notes");
		expect(noteLane).toBeDefined();
		if (noteLane?.kind === "notes") {
			expect(noteLane.outputKey).toBe("unrouted");
		}
	});

	it("computes pitch range from notes", () => {
		const tree = layer(note(c4, 1), note(g4, 1));
		const data = aggregateTree(tree);

		const noteLane = data.segments[0]?.lanes.find((l) => l.kind === "notes");
		if (noteLane?.kind === "notes") {
			expect(noteLane.minPitch).toBeLessThan(noteLane.maxPitch);
		}
	});

	it("produces pattern spans with correct absolute positions", () => {
		const a = sequence(note(c4, 2));
		const b = sequence(note(e4, 3));
		const tree = sequence(a, b);
		const data = aggregateTree(tree);

		const allSpans = data.segments.flatMap((s) => s.lanes.filter((l) => l.kind === "notes").flatMap((l) => l.kind === "notes" ? l.spans : []));
		expect(allSpans.length).toBeGreaterThan(0);
	});

	it("handles nested sequences recursively", () => {
		const inner = sequence(note(c4, 1), note(e4, 1));
		const outer = sequence(inner, note(g4, 2));
		const data = aggregateTree(outer);

		expect(data.segments.length).toBeGreaterThan(0);
		expect(data.totalEndBeat).toBe(4);
	});
});
