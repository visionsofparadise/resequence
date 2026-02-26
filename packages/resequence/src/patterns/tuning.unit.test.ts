import { describe, expect, it } from "vitest";
import { resolvePitch } from "../utils/pitch";
import { MetadataPattern, tuning } from "./metadata";
import { note } from "./note";
import { sequence } from "./sequence";

describe("tuning alias", () => {
	const minimalConfig = {
		classes: ["C"],
		octaveRatio: 2 as const,
		reference: { class: "C", octave: 4, hz: 264 },
	};

	it("creates MetadataPattern with tuning config", () => {
		const t = tuning(note("C4", "4n"), minimalConfig);
		expect(t).toBeInstanceOf(MetadataPattern);
		expect(t.meta.tuning).toEqual(minimalConfig);
		expect(t.type).toBe("metadata");
	});

	it("delegates durationBeats to child", () => {
		const t = tuning(note("C4", "4n"), minimalConfig);
		expect(t.durationBeats).toBe(1);
	});

	it("delegates sequence duration", () => {
		const t = tuning(sequence(note("C4", "4n"), note("E4", "4n")), minimalConfig);
		expect(t.durationBeats).toBe(2);
	});

	it("delegates notes to child", () => {
		const t = tuning(note("C4", "4n"), minimalConfig);
		expect(t.notes).toMatchObject([{ beat: 0, pitch: resolvePitch("C4") }]);
	});

	it("stores the tuning config in meta", () => {
		const config = {
			classes: ["C", "D", "E", "F", "G", "A", "B"],
			octaveRatio: 2 as const,
			reference: { class: "A", octave: 4, hz: 440 },
			frequencies: { C: 264, D: 297, E: 330, F: 352, G: 396, A: 440, B: 495 },
		};
		const t = tuning(note("C4", "4n"), config);
		expect(t.meta.tuning).toEqual(config);
	});
});
