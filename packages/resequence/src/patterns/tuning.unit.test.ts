import { describe, expect, it } from "vitest";
import { resolveDuration } from "../utils/duration";
import { resolvePitch } from "../utils/pitch";
import { MetadataPattern, tuning } from "./metadata";
import { note } from "./note";
import { sequence } from "./sequence";
import { collectNotes } from "./utils/tree";

describe("tuning alias", () => {
	const minimalConfig = {
		classes: ["C"],
		octaveRatio: 2 as const,
		reference: { class: "C", octave: 4, hz: 264 },
	};

	it("creates MetadataPattern with tuning config", () => {
		const t = tuning(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), minimalConfig);
		expect(t).toBeInstanceOf(MetadataPattern);
		expect(t.meta.tuning).toEqual(minimalConfig);
	});

	it("delegates durationBeats to child", () => {
		const t = tuning(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), minimalConfig);
		expect(t.endBeat - t.startBeat).toBe(1);
	});

	it("delegates sequence duration", () => {
		const t = tuning(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n"))), minimalConfig);
		expect(t.endBeat - t.startBeat).toBe(2);
	});

	it("delegates notes to child", () => {
		const t = tuning(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), minimalConfig);
		const notes = collectNotes(t);
		expect(notes).toMatchObject([{ startBeat: 0, pitch: resolvePitch("C4") }]);
	});

	it("stores the tuning config in meta", () => {
		const config = {
			classes: ["C", "D", "E", "F", "G", "A", "B"],
			octaveRatio: 2 as const,
			reference: { class: "A", octave: 4, hz: 440 },
			frequencies: { C: 264, D: 297, E: 330, F: 352, G: 396, A: 440, B: 495 },
		};
		const t = tuning(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), config);
		expect(t.meta.tuning).toEqual(config);
	});
});
