import { describe, expect, it } from "vitest";
import type { NoteEvent } from "./note-event";

describe("NoteEvent", () => {
	it("has the expected shape with all required fields", () => {
		const note: NoteEvent = {
			startMs: 0,
			stopMs: 500,
			cleanupMs: 500,
			note: 60,
			velocity: 100,
			bend: 0,
			frequency: 261.63,
		};

		expect(note.startMs).toBe(0);
		expect(note.stopMs).toBe(500);
		expect(note.cleanupMs).toBe(500);
		expect(note.note).toBe(60);
		expect(note.velocity).toBe(100);
		expect(note.bend).toBe(0);
		expect(note.frequency).toBeCloseTo(261.63);
	});

	it("supports optional CC properties", () => {
		const note: NoteEvent = {
			startMs: 0,
			stopMs: 500,
			cleanupMs: 500,
			note: 60,
			velocity: 100,
			bend: 0,
			frequency: 261.63,
			attack: 64,
			release: 32,
			sustain: 100,
			cutoff: 80,
			resonance: 40,
			volume: 127,
			expression: 120,
			pan: 64,
			chorus: 30,
			reverb: 50,
		};

		expect(note.attack).toBe(64);
		expect(note.reverb).toBe(50);
	});

	it("supports slides", () => {
		const note: NoteEvent = {
			startMs: 0,
			stopMs: 500,
			cleanupMs: 500,
			note: 60,
			velocity: 100,
			bend: 0,
			frequency: 261.63,
			slides: [{ timeMs: 100, cents: 200, curve: 0 }],
		};

		expect(note.slides).toHaveLength(1);
		expect(note.slides?.[0]?.cents).toBe(200);
	});
});
