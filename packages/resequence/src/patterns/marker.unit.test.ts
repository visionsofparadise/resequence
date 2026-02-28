import { describe, expect, it } from "vitest";
import { collectMarkers } from "../rendering/collect-markers";
import { resolveDuration } from "../utils/duration";
import { resolvePitch } from "../utils/pitch";
import { marker, MetadataPattern } from "./metadata";
import { note } from "./note";
import { sequence } from "./sequence";
import { collectNotes } from "./utils/tree";

describe("marker alias", () => {
	it("creates MetadataPattern with marker name", () => {
		const m = marker(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), "intro");
		expect(m).toBeInstanceOf(MetadataPattern);
		expect(m.meta.marker).toBe("intro");
	});

	it("delegates durationBeats to child", () => {
		const m = marker(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), "section");
		expect(m.endBeat - m.startBeat).toBe(1);
	});

	it("delegates sequence duration", () => {
		const m = marker(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n"))), "verse");
		expect(m.endBeat - m.startBeat).toBe(2);
	});

	it("delegates notes to child", () => {
		const m = marker(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), "start");
		const notes = collectNotes(m);
		expect(notes).toMatchObject([{ startBeat: 0, pitch: resolvePitch("C4") }]);
	});

	it("appears in collectMarkers", () => {
		const m = marker(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), "chorus");
		expect(collectMarkers(m)).toEqual([{ beat: 0, name: "chorus" }]);
	});
});
