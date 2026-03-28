import { describe, expect, it } from "vitest";
import type { NoteEvent, SetupResult, UnitContext } from "@resequence/web-au-core";

import { GeneratorUnit, type GeneratorUnitInput } from "./generator";

class TestGenerator extends GeneratorUnit {
	readonly type = ["unit", "midi", "generator", "test"] as const;

	scheduledNotes: Array<NoteEvent> = [];

	protected override _schedule(noteEvent: NoteEvent, context: UnitContext): void {
		const ne = this.offsetNote(noteEvent, context);

		this.scheduledNotes.push(ne);
	}

	protected override _setup(_context: UnitContext): SetupResult {
		const node = { connect: () => {}, disconnect: () => {} } as unknown as AudioNode;

		return { entries: [node], exits: [node] };
	}
}

function mockContext(latencyBudget = 0): UnitContext {
	return {
		audioContext: { sampleRate: 44100 } as BaseAudioContext,
		driverMap: new Map(),
		getSample: () => Promise.resolve({} as AudioBuffer),
		loadModule: () => Promise.resolve(),
		latencyBudget,
		basePath: ".",
	};
}

function makeNote(overrides?: Partial<NoteEvent>): NoteEvent {
	return {
		startMs: 0,
		stopMs: 500,
		cleanupMs: 600,
		note: 60,
		velocity: 100,
		bend: 0,
		frequency: 261.63,
		...overrides,
	};
}

describe("GeneratorUnit.offsetNote", () => {
	it("returns the original event unchanged when latencyBudget is 0", () => {
		const gen = new TestGenerator();
		const context = mockContext(0);
		const note = makeNote({ startMs: 100, stopMs: 500, cleanupMs: 600 });

		gen.schedule(note, context);

		const scheduled = gen.scheduledNotes[0];

		expect(scheduled).toBe(note);
	});

	it("offsets timing by latencyBudget converted to milliseconds", () => {
		const gen = new TestGenerator();
		const context = mockContext(4410); // 4410 samples at 44100Hz = 0.1s = 100ms
		const note = makeNote({ startMs: 0, stopMs: 500, cleanupMs: 600 });

		gen.schedule(note, context);

		const scheduled = gen.scheduledNotes[0];

		expect(scheduled).not.toBe(note);
		expect(scheduled?.startMs).toBe(100);
		expect(scheduled?.stopMs).toBe(600);
		expect(scheduled?.cleanupMs).toBe(700);
	});

	it("preserves non-timing properties when offsetting", () => {
		const gen = new TestGenerator();
		const context = mockContext(4410);
		const note = makeNote({ note: 72, velocity: 127, bend: 50 });

		gen.schedule(note, context);

		const scheduled = gen.scheduledNotes[0];

		expect(scheduled?.note).toBe(72);
		expect(scheduled?.velocity).toBe(127);
		expect(scheduled?.bend).toBe(50);
		expect(scheduled?.frequency).toBe(261.63);
	});
});
