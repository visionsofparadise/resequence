import { describe, expect, it, vi } from "vitest";
import type { Event, NoteEvent as PatternNoteEvent } from "@resequence/patterns";
import { Pattern } from "@resequence/patterns";
import type { UnitContext } from "@resequence/web-au";
import { PatternSource, PortUnit, patternSource } from "./pattern";

const C4_PITCH = { class: 0, stepsPerOctave: 12, octave: 4, octaveRatio: 2 };

function makeNoteEvent(port: string, startBeat: number, overrides: Partial<PatternNoteEvent> = {}): PatternNoteEvent {
	return {
		type: "note" as const,
		port,
		channel: 0,
		startBeat,
		durationBeats: 1,
		pitch: C4_PITCH,
		frequency: 261.63,
		midiNote: 60,
		bend: 0,
		velocity: 100,
		...overrides,
	};
}

class MockPattern extends Pattern {
	readonly type = ["pattern", "mock"] as const;
	private readonly events: Array<PatternNoteEvent>;

	constructor(events: Array<PatternNoteEvent>, endBeat: number) {
		super({ notes: [], children: [], startBeat: 0, endBeat });
		this.events = events;
	}

	override _setup(): Array<Event> {
		return [{ type: "tempo", beat: 0, bpm: 120 } as Event];
	}

	override _schedule(): Array<Event> {
		return this.events;
	}
}

function mockContext() {
	const gainNode = { connect: vi.fn(), disconnect: vi.fn() } as unknown as GainNode;

	return {
		audioContext: { createGain: () => gainNode } as unknown as BaseAudioContext,
		driverMap: new Map(),
		getSample: () => Promise.resolve({} as AudioBuffer),
		loadModule: () => Promise.resolve(),
		latencyBudget: 0,
	} as UnitContext;
}

describe("PatternSource", () => {
	it("creates port units on demand", () => {
		const source = patternSource(new MockPattern([], 4));
		const port = source.port("bass");

		expect(port).toBeInstanceOf(PortUnit);
		expect(port.portName).toBe("bass");
		expect(source.port("bass")).toBe(port);
	});

	it("dispatches note events to correct ports", async () => {
		const events = [
			makeNoteEvent("bass", 0),
			makeNoteEvent("lead", 0.5),
			makeNoteEvent("bass", 1),
		];

		const source = patternSource(new MockPattern(events, 4));
		const bass = source.port("bass");
		const lead = source.port("lead");

		const bassScheduled: Array<unknown> = [];
		const leadScheduled: Array<unknown> = [];

		const bassSpy = vi.spyOn(bass, "dispatch");
		const leadSpy = vi.spyOn(lead, "dispatch");

		const ctx = mockContext();
		await source.setup(ctx);

		source.play(0, 4, ctx);

		expect(bassSpy).toHaveBeenCalledTimes(2);
		expect(leadSpy).toHaveBeenCalledTimes(1);
	});

	it("ignores events for ports that have not been created", async () => {
		const events = [makeNoteEvent("drums", 0)];
		const source = patternSource(new MockPattern(events, 4));
		const bass = source.port("bass");

		const bassSpy = vi.spyOn(bass, "dispatch");

		const ctx = mockContext();
		await source.setup(ctx);
		source.play(0, 4, ctx);

		expect(bassSpy).not.toHaveBeenCalled();
	});

	it("maps pattern note events to unit note events", async () => {
		const events = [makeNoteEvent("bass", 1, { velocity: 80, midiNote: 48 })];
		const source = patternSource(new MockPattern(events, 4));
		const bass = source.port("bass");

		const bassSpy = vi.spyOn(bass, "dispatch");

		const ctx = mockContext();
		await source.setup(ctx);
		source.play(0, 4, ctx);

		expect(bassSpy).toHaveBeenCalledTimes(1);
		const note = bassSpy.mock.calls[0]![0];
		expect(note.note).toBe(48);
		expect(note.velocity).toBe(80);
		expect(note.startMs).toBeGreaterThan(0);
	});
});

describe("PortUnit", () => {
	it("is identifiable via static is()", () => {
		const port = new PortUnit({ portName: "test" });
		expect(PortUnit.is(port)).toBe(true);
	});

	it("has correct type discriminator", () => {
		const port = new PortUnit({ portName: "test" });
		expect(port.type).toEqual(["unit", "midi", "source", "port"]);
	});

	it("clones correctly", () => {
		const port = new PortUnit({ portName: "test" });
		const cloned = port.clone();
		expect(cloned).toBeInstanceOf(PortUnit);
		expect(cloned.portName).toBe("test");
	});
});
