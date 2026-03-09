import { describe, expect, it } from "vitest";
import type { PatternNoteEvent } from "./mapping";
import { mapNoteEvent } from "./mapping";
import type { TempoMap } from "@resequence/patterns";
import { CC } from "@resequence/web-au";

const C4_PITCH = { class: 0, stepsPerOctave: 12, octave: 4, octaveRatio: 2 };

function makeEvent(overrides: Partial<PatternNoteEvent> = {}): PatternNoteEvent {
	return {
		type: "note" as const,
		port: "default",
		channel: 0,
		startBeat: 0,
		durationBeats: 1,
		pitch: C4_PITCH,
		frequency: 261.63,
		midiNote: 60,
		bend: 0,
		velocity: 100,
		...overrides,
	};
}

describe("mapNoteEvent", () => {
	const tempoMap120: TempoMap = [{ beat: 0, bpm: 120 }];

	it("maps beat timing to milliseconds at 120 BPM", () => {
		const result = mapNoteEvent(makeEvent(), tempoMap120);
		expect(result.startMs).toBeCloseTo(0, 1);
		expect(result.stopMs).toBeCloseTo(500, 1);
		expect(result.note).toBe(60);
		expect(result.bend).toBe(0);
		expect(result.velocity).toBe(100);
	});

	it("calculates cleanupMs with release CC", () => {
		const event = makeEvent({ cc: { [CC.RELEASE]: 127 } });
		const result = mapNoteEvent(event, tempoMap120);
		expect(result.cleanupMs).toBeCloseTo(500 + 4000 + 500, 1);
	});

	it("suppresses release when sustain is on", () => {
		const event = makeEvent({ cc: { [CC.RELEASE]: 127, [CC.SUSTAIN]: 127 } });
		const result = mapNoteEvent(event, tempoMap120);
		expect(result.cleanupMs).toBeCloseTo(500 + 500, 1);
	});

	it("extracts CC to named properties", () => {
		const event = makeEvent({
			cc: { [CC.ATTACK]: 50, [CC.CUTOFF]: 80, [CC.PAN]: 64 },
		});
		const result = mapNoteEvent(event, tempoMap120);
		expect(result.attack).toBe(50);
		expect(result.cutoff).toBe(80);
		expect(result.pan).toBe(64);
	});

	it("handles tempo changes", () => {
		const map: TempoMap = [
			{ beat: 0, bpm: 120 },
			{ beat: 4, bpm: 60 },
		];
		const event = makeEvent({ startBeat: 4, durationBeats: 2 });
		const result = mapNoteEvent(event, map);
		expect(result.startMs).toBeCloseTo(2000, 1);
		expect(result.stopMs).toBeCloseTo(4000, 1);
	});

	it("maps slides from beats to ms", () => {
		const event = makeEvent({
			slides: [{ beat: 0.5, value: 0.4, curve: 0 }],
		});
		const result = mapNoteEvent(event, tempoMap120);
		expect(result.slides).toHaveLength(1);
		expect(result.slides![0]!.timeMs).toBeCloseTo(250, 1);
	});
});
