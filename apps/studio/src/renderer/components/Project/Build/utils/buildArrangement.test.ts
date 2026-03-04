import type { Lfo } from "resequence";
import { automate, CHROMATIC_TUNING, layer, N, note, sequence, timeSignature, tuning } from "resequence";
import { describe, expect, it } from "vitest";
import { buildArrangement } from "./buildArrangement";

const c4 = N.C4;
const e4 = N.E4;
const g4 = N.G4;

describe("buildArrangement", () => {
	it("produces horizontal sequences from a sequence", () => {
		const tree = sequence(note(c4, 2), note(e4, 2), note(g4, 2));
		const data = buildArrangement(tree);

		expect(data.startBeat).toBe(0);
		expect(data.endBeat).toBe(6);
		expect(data.sequences.length).toBeGreaterThan(0);
	});

	it("groups notes with the same output into one clip", () => {
		const tree = layer(note(c4, 2), note(e4, 2));
		const data = buildArrangement(tree);

		expect(data.sequences.length).toBe(1);
		const seq = data.sequences[0]!;
		const noteClips = seq.clips.filter((cl) => cl.type === "midi");
		expect(noteClips.length).toBe(1);
		expect(noteClips[0]!.notes.length).toBe(2);
	});

	it("returns empty sequences for an empty pattern", () => {
		const tree = sequence();
		const data = buildArrangement(tree);

		expect(data.sequences.length).toBe(0);
		expect(data.endBeat).toBe(0);
	});

	it("unrouted notes use 'unrouted' output key", () => {
		const tree = layer(note(c4, 1));
		const data = buildArrangement(tree);

		const noteClip = data.sequences[0]?.clips.find((cl) => cl.type === "midi");
		expect(noteClip).toBeDefined();
		if (noteClip?.type === "midi") {
			expect(noteClip.outputKey).toBe("unrouted");
		}
	});

	it("computes pitch range from notes", () => {
		const tree = layer(note(c4, 1), note(g4, 1));
		const data = buildArrangement(tree);

		const noteClip = data.sequences[0]?.clips.find((cl) => cl.type === "midi");
		if (noteClip?.type === "midi") {
			expect(noteClip.minPitch).toBeLessThan(noteClip.maxPitch);
		}
	});

	it("produces pattern spans with correct absolute positions", () => {
		const aa = sequence(note(c4, 2));
		const bb = sequence(note(e4, 3));
		const tree = sequence(aa, bb);
		const data = buildArrangement(tree);

		const allSpans = data.sequences.flatMap((ss) => ss.clips.filter((cl) => cl.type === "midi").flatMap((cl) => (cl.type === "midi" ? cl.spans : [])));
		expect(allSpans.length).toBeGreaterThan(0);
	});

	it("handles nested sequences recursively", () => {
		const inner = sequence(note(c4, 1), note(e4, 1));
		const outer = sequence(inner, note(g4, 2));
		const data = buildArrangement(outer);

		expect(data.sequences.length).toBeGreaterThan(0);
		expect(data.endBeat).toBe(4);
	});

	it("carries tuning and time signature from metadata wrapper", () => {
		const melody = layer(note(c4, 2));
		const wrapped = tuning(melody, CHROMATIC_TUNING);
		const data = buildArrangement(wrapped);

		const noteClip = data.sequences[0]?.clips.find((cl) => cl.type === "midi");
		expect(noteClip).toBeDefined();
		if (noteClip?.type === "midi") {
			expect(noteClip.tuning).toBe(CHROMATIC_TUNING);
			expect(noteClip.timeSignature).toEqual([4, 4]);
		}
	});

	it("segregates clips when metadata differs for same output", () => {
		const partA = tuning(layer(note(c4, 2)), CHROMATIC_TUNING);
		const partB = timeSignature(layer(note(e4, 2)), [3, 4]);
		const tree = sequence(partA, partB);
		const data = buildArrangement(tree);

		const noteClips = data.sequences.flatMap((ss) => ss.clips.filter((cl) => cl.type === "midi"));
		expect(noteClips.length).toBe(2);
	});

	it("propagates slides to aggregated notes", () => {
		const slides = [{ pitch: e4, beat: 1, curve: 0 }];
		const noteWithSlide = note(c4, 2, { slides });
		const tree = layer(noteWithSlide);
		const data = buildArrangement(tree);

		const noteClip = data.sequences[0]?.clips.find((cl) => cl.type === "midi");
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
		const data = buildArrangement(tree);

		const autoClip = data.sequences[0]?.clips.find((cl) => cl.type === "automation");
		if (autoClip?.type === "automation") {
			expect(autoClip.source).toEqual(keyframes);
		}
	});

	it("extends LFO automation clip endBeat to sequence endBeat", () => {
		const lfo: Lfo = { shape: "sine", value: 0.5, frequency: 2, delay: 0, attack: 0 };
		const tree = layer(note(c4, 8), automate("vibrato", "synth.detune", lfo));
		const data = buildArrangement(tree);

		const autoClip = data.sequences[0]?.clips.find((cl) => cl.type === "automation");
		if (autoClip?.type === "automation") {
			expect(autoClip.endBeat).toBe(8);
		}
	});
});
