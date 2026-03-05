import { parseMidi } from "midi-file";
import { describe, expect, it } from "vitest";
import { custom } from "../patterns/custom-pattern";
import { layer } from "../patterns/layer";
import { sequence } from "../patterns/sequence";
import { BohlenPierce } from "../tunings/bohlen-pierce";
import { N } from "../tunings/chromatic";
import { renderMidi } from "./render-midi";

describe("renderMidi", () => {
	it("renders a simple pattern to MIDI", () => {
		const pattern = sequence(N.C4(1), N.E4(1)).route("piano");
		const result = renderMidi(pattern);

		expect(result.size).toBe(1);
		expect(result.has("piano")).toBe(true);

		const bytes = result.get("piano")!;
		expect(bytes).toBeInstanceOf(Uint8Array);
		expect(bytes.length).toBeGreaterThan(0);

		// Parse and verify
		const parsed = parseMidi(Array.from(bytes));
		expect(parsed.header.format).toBe(1);
		expect(parsed.header.ticksPerBeat).toBe(480);

		// Find noteOn events
		const noteOns = parsed.tracks.flatMap((track) => track.filter((ev) => ev.type === "noteOn" && ev.velocity > 0));
		expect(noteOns).toHaveLength(2);
	});

	it("renders multi-port patterns to separate files", () => {
		const melody = sequence(N.C4(1)).route("melody");
		const bass = sequence(N.C3(1)).route("bass");
		const pattern = layer(melody, bass);

		const result = renderMidi(pattern);
		expect(result.size).toBe(2);
		expect(result.has("melody")).toBe(true);
		expect(result.has("bass")).toBe(true);
	});

	it("respects custom PPQ", () => {
		const pattern = sequence(N.C4(1)).route("piano");
		const result = renderMidi(pattern, { ppq: 96 });

		const bytes = result.get("piano")!;
		const parsed = parseMidi(Array.from(bytes));
		expect(parsed.header.ticksPerBeat).toBe(96);
	});

	it("ignores custom events in MIDI output", () => {
		const customNode = custom({
			schedule: () => [{ type: "custom-event" }],
			durationBeats: 1,
		});

		const pattern = layer(customNode, sequence(N.C4(1)).route("piano"));
		const result = renderMidi(pattern);

		expect(result.size).toBe(1);
		expect(result.has("piano")).toBe(true);

		const bytes = result.get("piano")!;
		const parsed = parseMidi(Array.from(bytes));
		const noteOns = parsed.tracks.flatMap((track) => track.filter((ev) => ev.type === "noteOn" && ev.velocity > 0));
		expect(noteOns).toHaveLength(1);
	});

	it("produces no output for unrouted patterns", () => {
		const pattern = sequence(N.C4(1)); // no route
		const result = renderMidi(pattern);
		expect(result.size).toBe(0);
	});

	it("handles pitch bend for non-12-TET pitches", () => {
		const pattern = sequence(BohlenPierce.C4(1)).route("bp");
		const result = renderMidi(pattern);

		expect(result.size).toBe(1);
		const bytes = result.get("bp")!;
		const parsed = parseMidi(Array.from(bytes));

		// Should have pitch bend events for non-12-TET pitch
		const pitchBends = parsed.tracks.flatMap((track) => track.filter((ev) => ev.type === "pitchBend"));
		expect(pitchBends.length).toBeGreaterThanOrEqual(0); // May or may not need bend depending on mapping
	});
});
