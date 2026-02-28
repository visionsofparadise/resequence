import { N } from "../tunings/chromatic";
import { parseMidi } from "midi-file";
import { describe, expect, it } from "vitest";
import { layer } from "../patterns/layer";
import { tempo } from "../patterns/tempo";
import { level } from "../patterns/modifiers/level";
import { transpose } from "../patterns/modifiers/transpose";
import { repeat } from "../patterns/modifiers/repeat";
import { sequence } from "../patterns/sequence";
import { sampler } from "../units/generators/sampler";
import { CC } from "../utils/cc";
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

	it("each per-track file is valid MIDI", () => {
		const pattern = sequence(N.C2(1)).route(bass);
		const result = renderMidi(pattern);

		const bassTrack = result.tracks.get("bass");
		expect(bassTrack).toBeDefined();

		const parsed = parseMidi(bassTrack!);
		expect(parsed.header.format).toBe(1);
		expect(parsed.header.numTracks).toBe(2);
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

	it("does not render master by default", () => {
		const pattern = sequence(N.C2(1)).route(bass);
		const result = renderMidi(pattern);
		expect(result.master).toBeUndefined();
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

	it("filters with exclude", () => {
		const pattern = layer(
			sequence(N.C2(1)).route(bass),
			sequence(N.C1(1)).route(drums),
		);

		const result = renderMidi(pattern, { exclude: ["drums"] });
		expect(result.tracks.size).toBe(1);
		expect(result.tracks.has("bass")).toBe(true);
	});

	it("handles pattern with no routed notes", () => {
		const pattern = sequence(N.C4(1));
		const result = renderMidi(pattern);
		expect(result.tracks.size).toBe(0);
	});

	it("preserves tempo from tempo wrapper", () => {
		const pattern = tempo(sequence(N.C2(1)).route(bass), 140);
		const result = renderMidi(pattern);

		const parsed = parseMidi(result.tracks.get("bass")!);
		const tempoTrack = parsed.tracks[0];
		const tempoEvent = tempoTrack.find((ev) => ev.type === "setTempo");
		if (tempoEvent?.type === "setTempo") {
			expect(tempoEvent.microsecondsPerBeat).toBe(Math.round(60_000_000 / 140));
		}
	});

	it("includes CC controller events from note cc option", () => {
		const pattern = sequence(N.C4(1, { cc: { [CC.VOLUME]: 64 } })).route(bass);
		const result = renderMidi(pattern);

		const encoded = result.tracks.get("bass");
		expect(encoded).toBeDefined();

		const parsed = parseMidi(encoded!);
		const noteTrack = parsed.tracks[1];
		const ccEvents = noteTrack.filter((ev) => ev.type === "controller");

		expect(ccEvents).toHaveLength(1);
		if (ccEvents[0]?.type === "controller") {
			expect(ccEvents[0].controllerType).toBe(CC.VOLUME);
			expect(ccEvents[0].value).toBe(64);
		}
	});

	it("exports MIDI from modifier patterns", () => {
		const pattern = transpose(sequence(N.C4(1)), 7).route(bass);
		const result = renderMidi(pattern);

		const encoded = result.tracks.get("bass");
		expect(encoded).toBeDefined();

		const parsed = parseMidi(encoded!);
		const noteTrack = parsed.tracks[1];
		const noteOns = noteTrack.filter((ev) => ev.type === "noteOn");
		expect(noteOns).toHaveLength(1);
		if (noteOns[0]?.type === "noteOn") {
			expect(noteOns[0].noteNumber).toBe(67);
		}
	});

	it("includes CC from level modifier in MIDI output", () => {
		const pattern = level(sequence(N.C4(1)), { cc: { [CC.CUTOFF]: 80 } }).route(bass);
		const result = renderMidi(pattern);

		const encoded = result.tracks.get("bass");
		expect(encoded).toBeDefined();

		const parsed = parseMidi(encoded!);
		const noteTrack = parsed.tracks[1];
		const noteOns = noteTrack.filter((ev) => ev.type === "noteOn");
		const ccEvents = noteTrack.filter((ev) => ev.type === "controller");

		expect(noteOns).toHaveLength(1);
		expect(ccEvents).toHaveLength(1);
		if (ccEvents[0]?.type === "controller") {
			expect(ccEvents[0].controllerType).toBe(CC.CUTOFF);
			expect(ccEvents[0].value).toBe(80);
		}
	});

	it("handles complex pattern tree", () => {
		const bassLine = sequence(
			N.C2(0.5),
			N.E2(0.5),
			N.G2(0.5),
			N.C3(0.5),
		);
		const kickPattern = repeat(sequence(N.C1(1)), 4);

		const pattern = tempo(layer(bassLine.route(bass), kickPattern.route(drums)), 126);

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

	it("appears in multiple tracks when routed to multiple outputs", () => {
		const bass2 = sampler("./bass2.wav", { root: N.C2, id: "bass2" });
		const pattern = sequence(N.C2(1)).route(bass).route(bass2);
		const result = renderMidi(pattern);
		expect(result.tracks.has("bass")).toBe(true);
		expect(result.tracks.has("bass2")).toBe(true);
	});
});
