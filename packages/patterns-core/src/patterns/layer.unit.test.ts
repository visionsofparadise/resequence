import { describe, expect, it } from "vitest";
import type { NoteEvent } from "../events";
import { N } from "../tunings/chromatic";
import { layer } from "./layer";
import { sequence } from "./sequence";

describe("layer", () => {
	it("places notes simultaneously", () => {
		const lay = layer(N.C4(2), N.E4(1));
		expect(lay.startBeat).toBe(0);
		expect(lay.endBeat).toBe(2);
		expect(lay.notes).toHaveLength(2);
		expect(lay.notes[0]?.offsetBeats).toBe(0);
		expect(lay.notes[1]?.offsetBeats).toBe(0);
	});

	it("places patterns simultaneously", () => {
		const a = sequence(N.C4(2));
		const b = sequence(N.E4(3));
		const combined = layer(a, b);

		expect(combined.endBeat).toBe(3);
		expect(combined.children).toHaveLength(2);
	});

	it("generates correct NoteEvents with routing", () => {
		const lay = layer(N.C4(2), N.E4(1)).route("strings");
		const events = lay.schedule(0, -Infinity, Infinity) as Array<NoteEvent>;

		expect(events).toHaveLength(2);
		expect(events[0]?.startBeat).toBe(0);
		expect(events[1]?.startBeat).toBe(0);
	});
});
