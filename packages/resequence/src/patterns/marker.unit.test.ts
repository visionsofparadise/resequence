import { describe, expect, it } from "vitest";
import { collectMarkers } from "../rendering/collect-markers";
import { N } from "../tunings/chromatic";
import { marker, MetadataPattern } from "./metadata";
import { sequence } from "./sequence";
import { collectNotes } from "./utils/tree";

describe("marker alias", () => {
	it("creates MetadataPattern with marker name", () => {
		const m = marker(sequence(N.C4(1)), "intro");
		expect(m).toBeInstanceOf(MetadataPattern);
		expect(m.meta.marker).toBe("intro");
	});

	it("delegates durationBeats to child", () => {
		const m = marker(sequence(N.C4(1)), "section");
		expect(m.endBeat - m.startBeat).toBe(1);
	});

	it("delegates sequence duration", () => {
		const m = marker(sequence(N.C4(1), N.E4(1)), "verse");
		expect(m.endBeat - m.startBeat).toBe(2);
	});

	it("delegates notes to child", () => {
		const m = marker(sequence(N.C4(1)), "start");
		const notes = collectNotes(m);
		expect(notes).toMatchObject([{ startBeat: 0, pitch: N.C4 }]);
	});

	it("appears in collectMarkers", () => {
		const m = marker(sequence(N.C4(1)), "chorus");
		expect(collectMarkers(m)).toEqual([{ beat: 0, name: "chorus" }]);
	});
});
