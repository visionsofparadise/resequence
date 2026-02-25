import { describe, expect, it } from "vitest";
import { note } from "./note";
import { sequence } from "./sequence";
import { marker, MarkerPattern } from "./marker";

describe("MarkerPattern", () => {
	it("creates with name", () => {
		const m = marker(note("C4", "4n"), "intro");
		expect(m).toBeInstanceOf(MarkerPattern);
		expect(m.name).toBe("intro");
		expect(m.type).toBe("marker");
	});

	it("delegates durationTicks to child", () => {
		const m = marker(note("C4", "4n"), "section");
		expect(m.durationTicks).toBe(480);
	});

	it("delegates sequence duration", () => {
		const m = marker(sequence(note("C4", "4n"), note("E4", "4n")), "verse");
		expect(m.durationTicks).toBe(960);
	});

	it("delegates notes to child", () => {
		const m = marker(note("C4", "4n"), "start");
		expect(m.notes).toMatchObject([{ tick: 0, pitch: 60 }]);
	});
});
