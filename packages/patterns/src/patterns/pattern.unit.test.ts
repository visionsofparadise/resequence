import { describe, expect, it } from "vitest";
import type { Event, NoteEvent } from "../events";
import { note } from "../note";
import { N } from "../tunings/chromatic";
import { layer } from "./layer";
import { MidiPattern } from "./midi";
import type { PatternProperties } from "./pattern";
import { Pattern } from "./pattern";
import { sequence } from "./sequence";

// Concrete test pattern for base class testing
class TestPattern extends Pattern {
	readonly type = ["pattern", "test"] as const;

	clone(overrides: Partial<PatternProperties>): TestPattern {
		return new TestPattern({ ...this.properties, ...overrides });
	}
}

// Test pattern that emits custom events
class TestEventPattern extends Pattern<PatternProperties & { readonly events: ReadonlyArray<Event> }> {
	readonly type = ["pattern", "test-event"] as const;

	override _setup(): Array<Event> {
		return [...this.properties.events];
	}

	override _schedule(): Array<Event> {
		return [...this.properties.events];
	}

	clone(overrides: Partial<PatternProperties>): TestEventPattern {
		return new TestEventPattern({ ...this.properties, ...overrides });
	}
}

function testEvents(events: ReadonlyArray<Event>, durationBeats: number): TestEventPattern {
	return new TestEventPattern({ notes: [], children: [], startBeat: 0, endBeat: durationBeats, events });
}

describe("Pattern base class", () => {
	it("exposes properties via getters", () => {
		const n = note(N.C4, 1);
		const pattern = new TestPattern({ notes: [{ offsetBeats: 0, note: n }], children: [], startBeat: 0, endBeat: 1 });

		expect(pattern.notes).toHaveLength(1);
		expect(pattern.children).toHaveLength(0);
		expect(pattern.startBeat).toBe(0);
		expect(pattern.endBeat).toBe(1);
	});

	it("schedule returns empty array when out of scope", () => {
		const pattern = new TestPattern({ notes: [], children: [], startBeat: 0, endBeat: 4 });
		const events = pattern.schedule(0, 5, 10);
		expect(events).toEqual([]);
	});

	it("schedule recurses children", () => {
		const child = sequence(N.C4(1)).route("piano");
		const parent = new TestPattern({ notes: [], children: [{ offsetBeats: 0, pattern: child }], startBeat: 0, endBeat: 1 });
		const events = parent.schedule(0, -Infinity, Infinity);
		expect(events).toHaveLength(1);
		expect((events[0] as NoteEvent).port).toBe("piano");
	});

	it("setup returns empty array by default", () => {
		const pattern = new TestPattern({ notes: [], children: [], startBeat: 0, endBeat: 0 });
		const events = pattern.setup(0);
		expect(events).toEqual([]);
	});

	it("setup recurses children", () => {
		const child = testEvents([{ type: "test" }], 1);
		const parent = new TestPattern({ notes: [], children: [{ offsetBeats: 0, pattern: child }], startBeat: 0, endBeat: 1 });
		const events = parent.setup(0);
		expect(events).toHaveLength(1);
		expect(events[0]?.type).toBe("test");
	});
});

describe("MidiPattern", () => {
	class TestMidiPattern extends MidiPattern {
		readonly type = ["pattern", "midi", "test"] as const;

		clone(overrides: Partial<PatternProperties>): TestMidiPattern {
			return new TestMidiPattern({ ...this.properties, ...overrides });
		}
	}

	it("produces NoteEvents from owned notes with ports", () => {
		const n = note(N.C4, 1);
		const pattern = new TestMidiPattern({ notes: [{ offsetBeats: 0, note: n }], children: [], startBeat: 0, endBeat: 1 });
		pattern.route("piano");

		const events = pattern.schedule(0, -Infinity, Infinity);
		expect(events).toHaveLength(1);

		const ne = events[0] as NoteEvent;
		expect(ne.type).toBe("note");
		expect(ne.port).toBe("piano");
		expect(ne.channel).toBe(0);
		expect(ne.startBeat).toBe(0);
		expect(ne.durationBeats).toBe(1);
		expect(ne.velocity).toBe(100);
	});

	it("produces no events without ports", () => {
		const n = note(N.C4, 1);
		const pattern = new TestMidiPattern({ notes: [{ offsetBeats: 0, note: n }], children: [], startBeat: 0, endBeat: 1 });
		const events = pattern.schedule(0, -Infinity, Infinity);
		expect(events).toEqual([]);
	});

	it("routes to specified channel", () => {
		const n = note(N.C4, 1);
		const pattern = new TestMidiPattern({ notes: [{ offsetBeats: 0, note: n }], children: [], startBeat: 0, endBeat: 1 });
		pattern.route("drums", 9);

		const events = pattern.schedule(0, -Infinity, Infinity);
		const ne = events[0] as NoteEvent;
		expect(ne.channel).toBe(9);
	});

	it("accumulates ports through nested patterns", () => {
		const child = sequence(N.C4(1));
		const parent = layer(child).route("piano");

		const events = parent.schedule(0, -Infinity, Infinity);
		expect(events).toHaveLength(1);
		expect((events[0] as NoteEvent).port).toBe("piano");
	});

	it("emits one NoteEvent per port per note", () => {
		const n = note(N.C4, 1);
		const pattern = new TestMidiPattern({ notes: [{ offsetBeats: 0, note: n }], children: [], startBeat: 0, endBeat: 1 });
		pattern.route("piano");
		pattern.route("synth");

		const events = pattern.schedule(0, -Infinity, Infinity);
		expect(events).toHaveLength(2);
		expect((events[0] as NoteEvent).port).toBe("piano");
		expect((events[1] as NoteEvent).port).toBe("synth");
	});
});

describe("custom events in tree", () => {
	it("custom events bubble up through tree", () => {
		const customNode = testEvents([{ type: "custom" }], 1);

		const tree = layer(customNode, sequence(N.C4(1)).route("piano"));
		const events = tree.schedule(0, -Infinity, Infinity);

		expect(events.some((ev) => ev.type === "custom")).toBe(true);
		expect(events.some((ev) => ev.type === "note")).toBe(true);
	});
});
