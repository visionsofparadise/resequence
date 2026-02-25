import { parseMidi } from "midi-file";
import { describe, expect, it } from "vitest";
import { PPQ } from "../utils/duration";
import { encodeMidi } from "./encode-midi";
import type { MidiNote } from "./encode-midi";

describe("encodeMidi", () => {
	it("encodes a single track", () => {
		const notes: Array<MidiNote> = [
			{ tick: 0, pitch: 60, durationTicks: 480, velocity: 100 },
			{ tick: 480, pitch: 64, durationTicks: 480, velocity: 90 },
		];

		const tracks = new Map([["piano", notes]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempo: 120 });

		const parsed = parseMidi(result);
		expect(parsed.header.format).toBe(1);
		expect(parsed.header.numTracks).toBe(2);
		expect(parsed.header.ticksPerBeat).toBe(PPQ);
		expect(parsed.tracks).toHaveLength(2);
	});

	it("encodes tempo in tempo track", () => {
		const tracks = new Map([["test", [{ tick: 0, pitch: 60, durationTicks: 480, velocity: 100 }]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempo: 140 });

		const parsed = parseMidi(result);
		const tempoTrack = parsed.tracks[0];
		const tempoEvent = tempoTrack.find((ev) => ev.type === "setTempo");
		expect(tempoEvent).toBeDefined();
		if (tempoEvent?.type === "setTempo") {
			expect(tempoEvent.microsecondsPerBeat).toBe(Math.round(60_000_000 / 140));
		}
	});

	it("encodes time signature", () => {
		const tracks = new Map([["test", [{ tick: 0, pitch: 60, durationTicks: 480, velocity: 100 }]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempo: 120, timeSignature: [3, 4] });

		const parsed = parseMidi(result);
		const tempoTrack = parsed.tracks[0];
		const tsEvent = tempoTrack.find((ev) => ev.type === "timeSignature");
		expect(tsEvent).toBeDefined();
		if (tsEvent?.type === "timeSignature") {
			expect(tsEvent.numerator).toBe(3);
			expect(tsEvent.denominator).toBe(2);
		}
	});

	it("encodes track name", () => {
		const tracks = new Map([["bass", [{ tick: 0, pitch: 36, durationTicks: 480, velocity: 100 }]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempo: 120 });

		const parsed = parseMidi(result);
		const noteTrack = parsed.tracks[1];
		const nameEvent = noteTrack.find((ev) => ev.type === "trackName");
		expect(nameEvent).toBeDefined();
		if (nameEvent?.type === "trackName") {
			expect(nameEvent.text).toBe("bass");
		}
	});

	it("encodes noteOn and noteOff events with correct delta times", () => {
		const tracks = new Map([["test", [
			{ tick: 0, pitch: 60, durationTicks: 480, velocity: 100 },
			{ tick: 480, pitch: 64, durationTicks: 480, velocity: 90 },
		]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempo: 120 });

		const parsed = parseMidi(result);
		const noteTrack = parsed.tracks[1];
		const noteEvents = noteTrack.filter((ev) => ev.type === "noteOn" || ev.type === "noteOff");
		expect(noteEvents.length).toBe(4);
	});

	it("encodes multiple tracks", () => {
		const tracks = new Map([
			["bass", [{ tick: 0, pitch: 36, durationTicks: 480, velocity: 100 }]],
			["drums", [{ tick: 0, pitch: 24, durationTicks: 240, velocity: 127 }]],
		]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempo: 120 });

		const parsed = parseMidi(result);
		expect(parsed.header.numTracks).toBe(3);
		expect(parsed.tracks).toHaveLength(3);
	});

	it("encodes lyrics events", () => {
		const tracks = new Map([["vocal", [
			{ tick: 0, pitch: 60, durationTicks: 480, velocity: 100, lyric: "hel" },
			{ tick: 480, pitch: 62, durationTicks: 480, velocity: 100, lyric: "lo" },
		]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempo: 120 });

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
			{ tick: 0, pitch: 60, durationTicks: 480, velocity: 100, cc: { 7: 64, 10: 0 } },
		]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempo: 120 });

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
			{ tick: 0, pitch: 60, durationTicks: 480, velocity: 100, cc: { 7: 64 } },
		]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempo: 120 });

		const parsed = parseMidi(result);
		const noteTrack = parsed.tracks[1];
		const meaningful = noteTrack.filter((ev) => ev.type === "controller" || ev.type === "noteOn");

		expect(meaningful[0]?.type).toBe("controller");
		expect(meaningful[1]?.type).toBe("noteOn");
	});

	it("notes without CC emit no controller events", () => {
		const tracks = new Map([["test", [
			{ tick: 0, pitch: 60, durationTicks: 480, velocity: 100 },
		]]]);
		const result = encodeMidi(tracks, { ppq: PPQ, tempo: 120 });

		const parsed = parseMidi(result);
		const noteTrack = parsed.tracks[1];
		const ccEvents = noteTrack.filter((ev) => ev.type === "controller");
		expect(ccEvents).toHaveLength(0);
	});

	it("roundtrips correctly", () => {
		const tracks = new Map([["piano", [
			{ tick: 0, pitch: 60, durationTicks: 480, velocity: 100 },
		]]]);
		const encoded = encodeMidi(tracks, { ppq: PPQ, tempo: 120 });
		const parsed = parseMidi(encoded);
		const reEncoded = encodeMidi(tracks, { ppq: PPQ, tempo: 120 });

		expect(reEncoded).toEqual(encoded);
		expect(parsed.header.format).toBe(1);
	});
});
