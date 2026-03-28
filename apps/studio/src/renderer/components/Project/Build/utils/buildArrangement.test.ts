import { layer, N, note, sequence, timeSignature, tuning } from "resequence";
import { automate, type Lfo } from "resequence";
import { describe, expect, it } from "vitest";
import { buildArrangement } from "./buildArrangement";

const c4 = N.C4;
const e4 = N.E4;
const g4 = N.G4;

describe("buildArrangement", () => {
	it("produces horizontal sequences from a sequence", () => {
		const tree = sequence(note(c4, 2), note(e4, 2), note(g4, 2));
		const { arrangement } = buildArrangement(tree);

		expect(arrangement.startBeat).toBe(0);
		expect(arrangement.endBeat).toBe(6);
		expect(arrangement.sequences.length).toBeGreaterThan(0);
	});

	it("groups notes with the same output into one clip", () => {
		const tree = layer(note(c4, 2), note(e4, 2));
		const { arrangement } = buildArrangement(tree);

		expect(arrangement.sequences.length).toBe(1);
		const seq = arrangement.sequences[0]!;
		const noteClips = seq.clips.filter((cl) => cl.type === "midi");
		expect(noteClips.length).toBe(1);
		expect(noteClips[0]!.notes.length).toBe(2);
	});

	it("returns empty sequences for an empty pattern", () => {
		const tree = sequence();
		const { arrangement } = buildArrangement(tree);

		expect(arrangement.sequences.length).toBe(0);
		expect(arrangement.endBeat).toBe(0);
	});

	it("unrouted notes use 'unrouted' port key", () => {
		const tree = layer(note(c4, 1));
		const { arrangement } = buildArrangement(tree);

		const noteClip = arrangement.sequences[0]?.clips.find((cl) => cl.type === "midi");
		expect(noteClip).toBeDefined();
		if (noteClip?.type === "midi") {
			expect(noteClip.port).toBe("unrouted");
		}
	});

	it("computes pitch range from notes", () => {
		const tree = layer(note(c4, 1), note(g4, 1));
		const { arrangement } = buildArrangement(tree);

		const noteClip = arrangement.sequences[0]?.clips.find((cl) => cl.type === "midi");
		if (noteClip?.type === "midi") {
			expect(noteClip.minPitch).toBeLessThan(noteClip.maxPitch);
		}
	});

	it("produces pattern spans with correct absolute positions", () => {
		const aa = sequence(note(c4, 2));
		const bb = sequence(note(e4, 3));
		const tree = sequence(aa, bb);
		const { arrangement } = buildArrangement(tree);

		const allSpans = arrangement.sequences.flatMap((ss) => ss.clips.filter((cl) => cl.type === "midi").flatMap((cl) => (cl.type === "midi" ? cl.spans : [])));
		expect(allSpans.length).toBeGreaterThan(0);
	});

	it("handles nested sequences recursively", () => {
		const inner = sequence(note(c4, 1), note(e4, 1));
		const outer = sequence(inner, note(g4, 2));
		const { arrangement } = buildArrangement(outer);

		expect(arrangement.sequences.length).toBeGreaterThan(0);
		expect(arrangement.endBeat).toBe(4);
	});

	it("carries tuning and time signature from metadata wrapper", () => {
		const melody = layer(note(c4, 2));
		const wrapped = tuning(melody, N.config);
		const { arrangement } = buildArrangement(wrapped);

		const noteClip = arrangement.sequences[0]?.clips.find((cl) => cl.type === "midi");
		expect(noteClip).toBeDefined();
		if (noteClip?.type === "midi") {
			expect(noteClip.tuning).toBe(N.config);
			expect(noteClip.timeSignature).toEqual([4, 4]);
		}
	});

	it("segregates clips when metadata differs for same output", () => {
		const partA = tuning(layer(note(c4, 2)), N.config);
		const partB = timeSignature(layer(note(e4, 2)), [3, 4]);
		const tree = sequence(partA, partB);
		const { arrangement } = buildArrangement(tree);

		const noteClips = arrangement.sequences.flatMap((ss) => ss.clips.filter((cl) => cl.type === "midi"));
		expect(noteClips.length).toBe(2);
	});

	it("propagates slides to aggregated notes", () => {
		const slides = [{ value: 0.5, beat: 1, curve: 0 }];
		const noteWithSlide = note(c4, 2, { slides });
		const tree = layer(noteWithSlide);
		const { arrangement } = buildArrangement(tree);

		const noteClip = arrangement.sequences[0]?.clips.find((cl) => cl.type === "midi");
		if (noteClip?.type === "midi") {
			expect(noteClip.notes[0]?.slides).toBeDefined();
			expect(noteClip.notes[0]!.slides!.length).toBeGreaterThan(0);
		}
	});

	it("carries source on automation clips with keyframes", () => {
		const keyframes = [
			{ beat: 0, value: 0 },
			{ beat: 4, value: 1 },
		];
		const tree = layer(automate("vol", "synth.gain", keyframes));
		const { arrangement } = buildArrangement(tree);

		const autoClip = arrangement.sequences[0]?.clips.find((cl) => cl.type === "automation");
		if (autoClip?.type === "automation") {
			expect(autoClip.source).toEqual(keyframes);
		}
	});

	it("extends LFO automation clip endBeat to sequence endBeat", () => {
		const lfo: Lfo = { shape: "sine", value: 0.5, frequency: 2, delay: 0, attack: 0 };
		const tree = layer(note(c4, 8), automate("vibrato", "synth.detune", lfo));
		const { arrangement } = buildArrangement(tree);

		const autoClip = arrangement.sequences[0]?.clips.find((cl) => cl.type === "automation");
		if (autoClip?.type === "automation") {
			expect(autoClip.endBeat).toBe(8);
		}
	});
});
