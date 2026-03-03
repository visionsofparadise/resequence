import { describe, expect, it } from "vitest";
import { automate, CHROMATIC_TUNING, layer, N, note, sequence, timeSignature, tuning } from "resequence";
import type { Lfo } from "resequence";
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

	it("carries tuning and time signature from metadata wrapper", () => {
		const melody = layer(note(c4, 2));
		const wrapped = tuning(melody, CHROMATIC_TUNING);
		const data = aggregateTree(wrapped);

		const noteLane = data.segments[0]?.lanes.find((l) => l.kind === "notes");
		expect(noteLane).toBeDefined();
		if (noteLane?.kind === "notes") {
			expect(noteLane.tuning).toBe(CHROMATIC_TUNING);
			expect(noteLane.timeSignature).toEqual([4, 4]);
		}
	});

	it("segregates lanes when metadata differs for same output", () => {
		const partA = tuning(layer(note(c4, 2)), CHROMATIC_TUNING);
		const partB = timeSignature(layer(note(e4, 2)), [3, 4]);
		const tree = sequence(partA, partB);
		const data = aggregateTree(tree);

		const noteLanes = data.segments.flatMap((seg) => seg.lanes.filter((l) => l.kind === "notes"));
		expect(noteLanes.length).toBe(2);
	});

	it("propagates slides to aggregated notes", () => {
		const slides = [{ pitch: e4, beat: 1, curve: 0 }];
		const noteWithSlide = note(c4, 2, { slides });
		const tree = layer(noteWithSlide);
		const data = aggregateTree(tree);

		const noteLane = data.segments[0]?.lanes.find((l) => l.kind === "notes");
		if (noteLane?.kind === "notes") {
			expect(noteLane.notes[0]?.slides).toBeDefined();
			expect(noteLane.notes[0]!.slides!.length).toBeGreaterThan(0);
		}
	});

	it("carries source on automation lanes with keyframes", () => {
		const keyframes = [{ beat: 0, value: 0 }, { beat: 4, value: 1 }];
		const tree = layer(automate("vol", "synth.gain", keyframes));
		const data = aggregateTree(tree);

		const autoLane = data.segments[0]?.lanes.find((l) => l.kind === "automation");
		if (autoLane?.kind === "automation") {
			expect(autoLane.source).toEqual(keyframes);
		}
	});

	it("extends LFO automation lane endBeat to segment endBeat", () => {
		const lfo: Lfo = { shape: "sine", value: 0.5, frequency: 2, delay: 0, attack: 0 };
		const tree = layer(note(c4, 8), automate("vibrato", "synth.detune", lfo));
		const data = aggregateTree(tree);

		const autoLane = data.segments[0]?.lanes.find((l) => l.kind === "automation");
		if (autoLane?.kind === "automation") {
			expect(autoLane.endBeat).toBe(8);
		}
	});
});
