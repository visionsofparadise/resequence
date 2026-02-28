import { parseMidi } from "midi-file";
import { describe, expect, it } from "vitest";
import { layer } from "../patterns/layer";
import { tempo } from "../patterns/tempo";
import { level } from "../patterns/modifiers/level";
import { transpose } from "../patterns/modifiers/transpose";
import { note } from "../patterns/note";
import { repeat } from "../patterns/modifiers/repeat";
import { sequence } from "../patterns/sequence";
import { sampler } from "../units/generators/sampler";
import { CC } from "../utils/cc";
import { resolveDuration } from "../utils/duration";
import { resolvePitch } from "../utils/pitch";
import { renderMidi } from "./render-midi";

describe("renderMidi", () => {
	const bass = sampler("./bass.wav", { root: "C2", id: "bass" });
	const drums = sampler({ C1: "./kick.wav", D1: "./snare.wav" }, { id: "drums" });

	it("renders per-track MIDI files", () => {
		const pattern = tempo(layer(
			sequence(note(resolvePitch("C2"), resolveDuration("4n"))).route(bass),
			sequence(note(resolvePitch("C1"), resolveDuration("4n"))).route(drums),
		), 120);

		const result = renderMidi(pattern);
		expect(result.tracks.size).toBe(2);
		expect(result.tracks.has("bass")).toBe(true);
		expect(result.tracks.has("drums")).toBe(true);
	});

	it("each per-track file is valid MIDI", () => {
		const pattern = sequence(note(resolvePitch("C2"), resolveDuration("4n"))).route(bass);
		const result = renderMidi(pattern);

		const bassTrack = result.tracks.get("bass");
		expect(bassTrack).toBeDefined();

		const parsed = parseMidi(bassTrack!);
		expect(parsed.header.format).toBe(1);
		expect(parsed.header.numTracks).toBe(2);
	});

	it("renders master when requested", () => {
		const pattern = layer(
			sequence(note(resolvePitch("C2"), resolveDuration("4n"))).route(bass),
			sequence(note(resolvePitch("C1"), resolveDuration("4n"))).route(drums),
		);

		const result = renderMidi(pattern, { master: true });
		expect(result.master).toBeDefined();

		const parsed = parseMidi(result.master!);
		expect(parsed.header.numTracks).toBe(3);
	});

	it("does not render master by default", () => {
		const pattern = sequence(note(resolvePitch("C2"), resolveDuration("4n"))).route(bass);
		const result = renderMidi(pattern);
		expect(result.master).toBeUndefined();
	});

	it("filters with include", () => {
		const pattern = layer(
			sequence(note(resolvePitch("C2"), resolveDuration("4n"))).route(bass),
			sequence(note(resolvePitch("C1"), resolveDuration("4n"))).route(drums),
		);

		const result = renderMidi(pattern, { include: ["bass"] });
		expect(result.tracks.size).toBe(1);
		expect(result.tracks.has("bass")).toBe(true);
		expect(result.tracks.has("drums")).toBe(false);
	});

	it("filters with exclude", () => {
		const pattern = layer(
			sequence(note(resolvePitch("C2"), resolveDuration("4n"))).route(bass),
			sequence(note(resolvePitch("C1"), resolveDuration("4n"))).route(drums),
		);

		const result = renderMidi(pattern, { exclude: ["drums"] });
		expect(result.tracks.size).toBe(1);
		expect(result.tracks.has("bass")).toBe(true);
	});

	it("handles pattern with no routed notes", () => {
		const pattern = sequence(note(resolvePitch("C4"), resolveDuration("4n")));
		const result = renderMidi(pattern);
		expect(result.tracks.size).toBe(0);
	});

	it("preserves tempo from tempo wrapper", () => {
		const pattern = tempo(sequence(note(resolvePitch("C2"), resolveDuration("4n"))).route(bass), 140);
		const result = renderMidi(pattern);

		const parsed = parseMidi(result.tracks.get("bass")!);
		const tempoTrack = parsed.tracks[0];
		const tempoEvent = tempoTrack.find((ev) => ev.type === "setTempo");
		if (tempoEvent?.type === "setTempo") {
			expect(tempoEvent.microsecondsPerBeat).toBe(Math.round(60_000_000 / 140));
		}
	});

	it("includes CC controller events from note cc option", () => {
		const pattern = sequence(note(resolvePitch("C4"), resolveDuration("4n"), { cc: { [CC.VOLUME]: 64 } })).route(bass);
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
		const pattern = transpose(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 7).route(bass);
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
		const pattern = level(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), { cc: { [CC.CUTOFF]: 80 } }).route(bass);
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
			note(resolvePitch("C2"), resolveDuration("8n")),
			note(resolvePitch("E2"), resolveDuration("8n")),
			note(resolvePitch("G2"), resolveDuration("8n")),
			note(resolvePitch("C3"), resolveDuration("8n")),
		);
		const kickPattern = repeat(sequence(note(resolvePitch("C1"), resolveDuration("4n"))), 4);

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
		const bass2 = sampler("./bass2.wav", { root: "C2", id: "bass2" });
		const pattern = sequence(note(resolvePitch("C2"), resolveDuration("4n"))).route(bass).route(bass2);
		const result = renderMidi(pattern);
		expect(result.tracks.has("bass")).toBe(true);
		expect(result.tracks.has("bass2")).toBe(true);
	});
});
