import { parseMidi } from "midi-file";
import { describe, expect, it } from "vitest";
import { instrument, kit } from "../instrument/instrument";
import { layer } from "../patterns/layer";
import { metadata } from "../patterns/metadata";
import { note } from "../patterns/note";
import { repeat } from "../patterns/repeat";
import { sequence } from "../patterns/sequence";
import { renderMidi } from "./render-midi";

describe("renderMidi", () => {
	const bass = instrument("bass", "./bass.wav", { root: "C2" });
	const drums = kit("drums", { C1: "./kick.wav", D1: "./snare.wav" });

	it("renders per-track MIDI files", () => {
		const pattern = metadata(
			layer(
				note("C2", "4n").routeTo(bass),
				note("C1", "4n").routeTo(drums),
			),
			{ tempo: 120 },
		);

		const result = renderMidi(pattern);
		expect(result.tracks.size).toBe(2);
		expect(result.tracks.has("bass")).toBe(true);
		expect(result.tracks.has("drums")).toBe(true);
	});

	it("each per-track file is valid MIDI", () => {
		const pattern = note("C2", "4n").routeTo(bass);
		const result = renderMidi(pattern);

		const bassTrack = result.tracks.get("bass");
		expect(bassTrack).toBeDefined();

		const parsed = parseMidi(bassTrack!);
		expect(parsed.header.format).toBe(1);
		expect(parsed.header.numTracks).toBe(2);
	});

	it("renders master when requested", () => {
		const pattern = layer(
			note("C2", "4n").routeTo(bass),
			note("C1", "4n").routeTo(drums),
		);

		const result = renderMidi(pattern, { master: true });
		expect(result.master).toBeDefined();

		const parsed = parseMidi(result.master!);
		expect(parsed.header.numTracks).toBe(3);
	});

	it("does not render master by default", () => {
		const pattern = note("C2", "4n").routeTo(bass);
		const result = renderMidi(pattern);
		expect(result.master).toBeUndefined();
	});

	it("filters with include", () => {
		const pattern = layer(
			note("C2", "4n").routeTo(bass),
			note("C1", "4n").routeTo(drums),
		);

		const result = renderMidi(pattern, { include: ["bass"] });
		expect(result.tracks.size).toBe(1);
		expect(result.tracks.has("bass")).toBe(true);
		expect(result.tracks.has("drums")).toBe(false);
	});

	it("filters with exclude", () => {
		const pattern = layer(
			note("C2", "4n").routeTo(bass),
			note("C1", "4n").routeTo(drums),
		);

		const result = renderMidi(pattern, { exclude: ["drums"] });
		expect(result.tracks.size).toBe(1);
		expect(result.tracks.has("bass")).toBe(true);
	});

	it("handles pattern with no routed notes", () => {
		const pattern = note("C4", "4n");
		const result = renderMidi(pattern);
		expect(result.tracks.size).toBe(0);
	});

	it("preserves tempo from metadata", () => {
		const pattern = metadata(note("C2", "4n").routeTo(bass), { tempo: 140 });
		const result = renderMidi(pattern);

		const parsed = parseMidi(result.tracks.get("bass")!);
		const tempoTrack = parsed.tracks[0];
		const tempoEvent = tempoTrack.find((ev) => ev.type === "setTempo");
		if (tempoEvent?.type === "setTempo") {
			expect(tempoEvent.microsecondsPerBeat).toBe(Math.round(60_000_000 / 140));
		}
	});

	it("handles complex pattern tree", () => {
		const bassLine = sequence(note("C2", "8n"), note("E2", "8n"), note("G2", "8n"), note("C3", "8n"));
		const kickPattern = repeat(note("C1", "4n"), 4);

		const pattern = metadata(
			layer(bassLine.routeTo(bass), kickPattern.routeTo(drums)),
			{ tempo: 126 },
		);

		const result = renderMidi(pattern, { master: true });
		expect(result.tracks.size).toBe(2);
		expect(result.master).toBeDefined();

		const bassParsed = parseMidi(result.tracks.get("bass")!);
		const bassNoteTrack = bassParsed.tracks[1];
		const bassNoteOns = bassNoteTrack.filter((ev) => ev.type === "noteOn");
		expect(bassNoteOns).toHaveLength(4);

		const drumsParsed = parseMidi(result.tracks.get("drums")!);
		const drumsNoteTrack = drumsParsed.tracks[1];
		const drumsNoteOns = drumsNoteTrack.filter((ev) => ev.type === "noteOn");
		expect(drumsNoteOns).toHaveLength(4);
	});
});
