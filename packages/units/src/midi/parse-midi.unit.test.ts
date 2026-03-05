import { describe, expect, it } from "vitest";
import { writeMidi } from "midi-file";
import type { MidiData, MidiEvent } from "midi-file";
import { parseMidiFile } from "./parse-midi";

function buildMidi(tracks: Array<Array<MidiEvent>>, ticksPerBeat = 480): Uint8Array {
	const data: MidiData = {
		header: { format: 1, numTracks: tracks.length, ticksPerBeat },
		tracks,
	};
	return new Uint8Array(writeMidi(data));
}

describe("parseMidiFile", () => {
	it("parses a single note", () => {
		const bytes = buildMidi([
			[{ deltaTime: 0, type: "endOfTrack" }],
			[
				{ deltaTime: 0, type: "noteOn", channel: 0, noteNumber: 60, velocity: 100 },
				{ deltaTime: 480, type: "noteOff", channel: 0, noteNumber: 60, velocity: 0 },
				{ deltaTime: 0, type: "endOfTrack" },
			],
		]);

		const notes = parseMidiFile(bytes);

		expect(notes).toHaveLength(1);
		expect(notes[0]?.note).toBe(60);
		expect(notes[0]?.velocity).toBe(100);
		expect(notes[0]?.startMs).toBe(0);
		expect(notes[0]?.stopMs).toBeCloseTo(500, 0);
		expect(notes[0]?.frequency).toBeCloseTo(261.63, 1);
	});

	it("handles multiple notes", () => {
		const bytes = buildMidi([
			[{ deltaTime: 0, type: "endOfTrack" }],
			[
				{ deltaTime: 0, type: "noteOn", channel: 0, noteNumber: 60, velocity: 100 },
				{ deltaTime: 240, type: "noteOn", channel: 0, noteNumber: 64, velocity: 80 },
				{ deltaTime: 240, type: "noteOff", channel: 0, noteNumber: 60, velocity: 0 },
				{ deltaTime: 0, type: "noteOff", channel: 0, noteNumber: 64, velocity: 0 },
				{ deltaTime: 0, type: "endOfTrack" },
			],
		]);

		const notes = parseMidiFile(bytes);

		expect(notes).toHaveLength(2);
	});

	it("handles tempo changes", () => {
		const bytes = buildMidi([
			[
				{ deltaTime: 0, type: "setTempo", microsecondsPerBeat: 500000 },
				{ deltaTime: 480, type: "setTempo", microsecondsPerBeat: 1000000 },
				{ deltaTime: 0, type: "endOfTrack" },
			],
			[
				{ deltaTime: 0, type: "noteOn", channel: 0, noteNumber: 60, velocity: 100 },
				{ deltaTime: 960, type: "noteOff", channel: 0, noteNumber: 60, velocity: 0 },
				{ deltaTime: 0, type: "endOfTrack" },
			],
		]);

		const notes = parseMidiFile(bytes);

		expect(notes).toHaveLength(1);
		expect(notes[0]?.startMs).toBe(0);
		expect(notes[0]?.stopMs).toBeCloseTo(1500, 0);
	});

	it("extracts CC values within note range", () => {
		const bytes = buildMidi([
			[{ deltaTime: 0, type: "endOfTrack" }],
			[
				{ deltaTime: 0, type: "controller", channel: 0, controllerType: 7, value: 100 },
				{ deltaTime: 0, type: "noteOn", channel: 0, noteNumber: 60, velocity: 100 },
				{ deltaTime: 480, type: "noteOff", channel: 0, noteNumber: 60, velocity: 0 },
				{ deltaTime: 0, type: "endOfTrack" },
			],
		]);

		const notes = parseMidiFile(bytes);

		expect(notes[0]?.volume).toBe(100);
	});

	it("converts pitch bend to slides", () => {
		const bytes = buildMidi([
			[{ deltaTime: 0, type: "endOfTrack" }],
			[
				{ deltaTime: 0, type: "noteOn", channel: 0, noteNumber: 60, velocity: 100 },
				{ deltaTime: 240, type: "pitchBend", channel: 0, value: 8191 },
				{ deltaTime: 240, type: "noteOff", channel: 0, noteNumber: 60, velocity: 0 },
				{ deltaTime: 0, type: "endOfTrack" },
			],
		]);

		const notes = parseMidiFile(bytes);

		expect(notes[0]?.slides).toHaveLength(1);
		expect(notes[0]?.slides?.[0]?.cents).toBeCloseTo(200, 0);
		expect(notes[0]?.slides?.[0]?.timeMs).toBeCloseTo(250, 0);
	});

	it("handles velocity-0 noteOn as noteOff", () => {
		const bytes = buildMidi([
			[{ deltaTime: 0, type: "endOfTrack" }],
			[
				{ deltaTime: 0, type: "noteOn", channel: 0, noteNumber: 60, velocity: 100 },
				{ deltaTime: 480, type: "noteOn", channel: 0, noteNumber: 60, velocity: 0 },
				{ deltaTime: 0, type: "endOfTrack" },
			],
		]);

		const notes = parseMidiFile(bytes);

		expect(notes).toHaveLength(1);
		expect(notes[0]?.stopMs).toBeCloseTo(500, 0);
	});
});
