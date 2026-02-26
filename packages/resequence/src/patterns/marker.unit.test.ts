import { describe, expect, it } from "vitest";
import { resolvePitch } from "../utils/pitch";
import { marker, MetadataPattern } from "./metadata";
import { note } from "./note";
import { sequence } from "./sequence";

describe("marker alias", () => {
	it("creates MetadataPattern with marker name", () => {
		const m = marker(note("C4", "4n"), "intro");
		expect(m).toBeInstanceOf(MetadataPattern);
		expect(m.meta.marker).toBe("intro");
		expect(m.type).toBe("metadata");
	});

	it("delegates durationBeats to child", () => {
		const m = marker(note("C4", "4n"), "section");
		expect(m.durationBeats).toBe(1);
	});

	it("delegates sequence duration", () => {
		const m = marker(sequence(note("C4", "4n"), note("E4", "4n")), "verse");
		expect(m.durationBeats).toBe(2);
	});

	it("delegates notes to child", () => {
		const m = marker(note("C4", "4n"), "start");
		expect(m.notes).toMatchObject([{ beat: 0, pitch: resolvePitch("C4") }]);
	});

	it("appears in metadatas aggregation", () => {
		const m = marker(note("C4", "4n"), "chorus");
		expect(m.metadatas).toEqual([{ beat: 0, meta: { marker: "chorus" } }]);
	});
});
