import { N } from "../tunings/chromatic";
import { parseMidi } from "midi-file";
import { describe, expect, it } from "vitest";
import { layer } from "../patterns/layer";
import { tempo } from "../patterns/tempo";
import { sequence } from "../patterns/sequence";
import { sampler } from "../units/generators/sampler";
import { renderMidi } from "./render-midi";

describe("renderMidi", () => {
	const bass = sampler("./bass.wav", { root: N.C2, id: "bass" });
	const drums = sampler([
		{ sample: "./kick.wav", root: N.C1 },
		{ sample: "./snare.wav", root: N.D1 },
	], { id: "drums" });

	it("renders per-track MIDI files", () => {
		const pattern = tempo(layer(
			sequence(N.C2(1)).route(bass),
			sequence(N.C1(1)).route(drums),
		), 120);

		const result = renderMidi(pattern);
		expect(result.tracks.size).toBe(2);
		expect(result.tracks.has("bass")).toBe(true);
		expect(result.tracks.has("drums")).toBe(true);
	});

	it("renders master when requested", () => {
		const pattern = layer(
			sequence(N.C2(1)).route(bass),
			sequence(N.C1(1)).route(drums),
		);

		const result = renderMidi(pattern, { master: true });
		expect(result.master).toBeDefined();

		const parsed = parseMidi(result.master!);
		expect(parsed.header.numTracks).toBe(3);
	});

	it("filters with include", () => {
		const pattern = layer(
			sequence(N.C2(1)).route(bass),
			sequence(N.C1(1)).route(drums),
		);

		const result = renderMidi(pattern, { include: ["bass"] });
		expect(result.tracks.size).toBe(1);
		expect(result.tracks.has("bass")).toBe(true);
		expect(result.tracks.has("drums")).toBe(false);
	});

	it("handles pattern with no routed notes", () => {
		const pattern = sequence(N.C4(1));
		const result = renderMidi(pattern);
		expect(result.tracks.size).toBe(0);
	});

	it("appears in multiple tracks when routed to multiple outputs", () => {
		const bass2 = sampler("./bass2.wav", { root: N.C2, id: "bass2" });
		const pattern = sequence(N.C2(1)).route(bass).route(bass2);
		const result = renderMidi(pattern);
		expect(result.tracks.has("bass")).toBe(true);
		expect(result.tracks.has("bass2")).toBe(true);
	});
});
