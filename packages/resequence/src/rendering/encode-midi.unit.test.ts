import { parseMidi } from "midi-file";
import { describe, expect, it } from "vitest";
import { PPQ } from "../utils/duration";
import { encodeMidi } from "./encode-midi";
import type { MidiNote } from "./encode-midi";

const noTempoChanges = [] as const;
const noMarkers = [] as const;

describe("encodeMidi", () => {
	it("encodes a single track", () => {
		const notes: Array<MidiNote> = [
			{ tick: 0, pitch: 60, durationTicks: PPQ, velocity: 100 },
			{ tick: PPQ, pitch: 64, durationTicks: PPQ, velocity: 90 },
		];

		const tracks = new Map([["piano", notes]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempoChanges: noTempoChanges, markers: noMarkers });

		const parsed = parseMidi(result);
		expect(parsed.header.format).toBe(1);
		expect(parsed.header.numTracks).toBe(2);
		expect(parsed.header.ticksPerBeat).toBe(PPQ);
		expect(parsed.tracks).toHaveLength(2);
	});

	it("encodes a single tempo change at tick 0", () => {
		const tracks = new Map([["test", [{ tick: 0, pitch: 60, durationTicks: PPQ, velocity: 100 }]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempoChanges: [{ beat: 0, bpm: 140 }], markers: noMarkers });

		const parsed = parseMidi(result);
		const tempoTrack = parsed.tracks[0];
		const tempoEvent = tempoTrack.find((ev) => ev.type === "setTempo");
		expect(tempoEvent).toBeDefined();
		if (tempoEvent?.type === "setTempo") {
			expect(tempoEvent.microsecondsPerBeat).toBe(Math.round(60_000_000 / 140));
		}
	});

	it("defaults to 120 bpm when no tempo changes provided", () => {
		const tracks = new Map([["test", [{ tick: 0, pitch: 60, durationTicks: PPQ, velocity: 100 }]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempoChanges: noTempoChanges, markers: noMarkers });

		const parsed = parseMidi(result);
		const tempoTrack = parsed.tracks[0];
		const tempoEvent = tempoTrack.find((ev) => ev.type === "setTempo");
		expect(tempoEvent).toBeDefined();
		if (tempoEvent?.type === "setTempo") {
			expect(tempoEvent.microsecondsPerBeat).toBe(Math.round(60_000_000 / 120));
		}
	});

	it("encodes marker meta events", () => {
		const tracks = new Map([["test", [{ tick: 0, pitch: 60, durationTicks: PPQ, velocity: 100 }]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempoChanges: noTempoChanges, markers: [{ beat: 0, name: "intro" }, { beat: 1, name: "verse" }] });

		const parsed = parseMidi(result);
		const tempoTrack = parsed.tracks[0];
		const markerEvents = tempoTrack.filter((ev) => ev.type === "marker");
		expect(markerEvents).toHaveLength(2);
		if (markerEvents[0]?.type === "marker") {
			expect(markerEvents[0].text).toBe("intro");
		}
	});

	it("encodes time signature", () => {
		const tracks = new Map([["test", [{ tick: 0, pitch: 60, durationTicks: PPQ, velocity: 100 }]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempoChanges: noTempoChanges, markers: noMarkers, timeSignatureChanges: [{ beat: 0, timeSignature: [3, 4] }] });

		const parsed = parseMidi(result);
		const tempoTrack = parsed.tracks[0];
		const tsEvent = tempoTrack.find((ev) => ev.type === "timeSignature");
		expect(tsEvent).toBeDefined();
		if (tsEvent?.type === "timeSignature") {
			expect(tsEvent.numerator).toBe(3);
			expect(tsEvent.denominator).toBe(2);
		}
	});

	it("defaults to 4/4 when no time signature changes provided", () => {
		const tracks = new Map([["test", [{ tick: 0, pitch: 60, durationTicks: PPQ, velocity: 100 }]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempoChanges: noTempoChanges, markers: noMarkers });

		const parsed = parseMidi(result);
		const tempoTrack = parsed.tracks[0];
		const tsEvent = tempoTrack.find((ev) => ev.type === "timeSignature");
		expect(tsEvent).toBeDefined();
		if (tsEvent?.type === "timeSignature") {
			expect(tsEvent.numerator).toBe(4);
			expect(tsEvent.denominator).toBe(2);
		}
	});

	it("encodes noteOn and noteOff events with correct delta times", () => {
		const tracks = new Map([["test", [
			{ tick: 0, pitch: 60, durationTicks: PPQ, velocity: 100 },
			{ tick: PPQ, pitch: 64, durationTicks: PPQ, velocity: 90 },
		]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempoChanges: noTempoChanges, markers: noMarkers });

		const parsed = parseMidi(result);
		const noteTrack = parsed.tracks[1];
		const noteEvents = noteTrack.filter((ev) => ev.type === "noteOn" || ev.type === "noteOff");
		expect(noteEvents.length).toBe(4);
	});

	it("encodes lyrics events", () => {
		const tracks = new Map([["vocal", [
			{ tick: 0, pitch: 60, durationTicks: PPQ, velocity: 100, lyric: "hel" },
			{ tick: PPQ, pitch: 62, durationTicks: PPQ, velocity: 100, lyric: "lo" },
		]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempoChanges: noTempoChanges, markers: noMarkers });

		const parsed = parseMidi(result);
		const noteTrack = parsed.tracks[1];
		const lyricEvents = noteTrack.filter((ev) => ev.type === "lyrics");
		expect(lyricEvents).toHaveLength(2);
		if (lyricEvents[0].type === "lyrics") {
			expect(lyricEvents[0].text).toBe("hel");
		}
	});

	it("encodes CC as controller events at the note tick", () => {
		const tracks = new Map([["test", [
			{ tick: 0, pitch: 60, durationTicks: PPQ, velocity: 100, cc: { 7: 64, 10: 0 } },
		]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempoChanges: noTempoChanges, markers: noMarkers });

		const parsed = parseMidi(result);
		const noteTrack = parsed.tracks[1];
		const ccEvents = noteTrack.filter((ev) => ev.type === "controller");

		expect(ccEvents).toHaveLength(2);

		const cc7 = ccEvents.find((ev) => ev.type === "controller" && ev.controllerType === 7);
		expect(cc7).toBeDefined();
		if (cc7?.type === "controller") {
			expect(cc7.value).toBe(64);
			expect(cc7.deltaTime).toBe(0);
		}

		const cc10 = ccEvents.find((ev) => ev.type === "controller" && ev.controllerType === 10);
		expect(cc10).toBeDefined();
		if (cc10?.type === "controller") {
			expect(cc10.value).toBe(0);
		}
	});

	it("emits CC events before noteOn at the same tick", () => {
		const tracks = new Map([["test", [
			{ tick: 0, pitch: 60, durationTicks: PPQ, velocity: 100, cc: { 7: 64 } },
		]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempoChanges: noTempoChanges, markers: noMarkers });

		const parsed = parseMidi(result);
		const noteTrack = parsed.tracks[1];
		const meaningful = noteTrack.filter((ev) => ev.type === "controller" || ev.type === "noteOn");

		expect(meaningful[0]?.type).toBe("controller");
		expect(meaningful[1]?.type).toBe("noteOn");
	});

});
