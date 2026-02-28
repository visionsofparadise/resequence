import { describe, expect, it } from "vitest";
import { N } from "../tunings/chromatic";
import { MetadataPattern, tuning } from "./metadata";
import { sequence } from "./sequence";

describe("tuning alias", () => {
	it("creates MetadataPattern with tuning config", () => {
		const minimalConfig = {
			classes: ["C"],
			octaveRatio: 2 as const,
			reference: { class: "C", octave: 4, hz: 264 },
		};
		const t = tuning(sequence(N.C4(1)), minimalConfig);
		expect(t).toBeInstanceOf(MetadataPattern);
		expect(t.meta.tuning).toEqual(minimalConfig);
	});
});
