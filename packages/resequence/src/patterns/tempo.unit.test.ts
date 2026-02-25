import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
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

	it("delegates durationTicks to child", () => {
		const t = tempo(note("C4", "4n"), 120);
		expect(t.durationTicks).toBe(480);
	});

	it("delegates sequence duration", () => {
		const t = tempo(sequence(note("C4", "4n"), note("E4", "4n")), 120);
		expect(t.durationTicks).toBe(960);
	});

	it("delegates notes to child", () => {
		const t = tempo(note("C4", "4n"), 120);
		expect(t.notes).toMatchObject([{ tick: 0, pitch: 60 }]);
	});
});
