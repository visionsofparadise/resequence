import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import { resolvePitch } from "../utils/pitch";
import { note } from "./note";
import { sequence } from "./sequence";
import { tempo, TempoPattern } from "./tempo";

describe("TempoPattern", () => {
	it("creates with valid bpm", () => {
		const t = tempo(note("C4", "4n"), 140);
		expect(t).toBeInstanceOf(TempoPattern);
		expect(t.bpm).toBe(140);
		expect(t.type).toBe("tempo");
	});

	it("throws for bpm <= 0", () => {
		expect(() => tempo(note("C4", "4n"), 0)).toThrow(ResequenceError);
		expect(() => tempo(note("C4", "4n"), -10)).toThrow("bpm must be greater than 0");
	});

	it("delegates durationBeats to child", () => {
		const t = tempo(note("C4", "4n"), 120);
		expect(t.durationBeats).toBe(1);
	});

	it("delegates sequence duration", () => {
		const t = tempo(sequence(note("C4", "4n"), note("E4", "4n")), 120);
		expect(t.durationBeats).toBe(2);
	});

	it("delegates notes to child", () => {
		const t = tempo(note("C4", "4n"), 120);
		expect(t.notes).toMatchObject([{ beat: 0, pitch: resolvePitch("C4") }]);
	});
});
