import { describe, expect, it } from "vitest";
import { PatternsError } from "../error";
import { N } from "../tunings/chromatic";
import { sequence } from "./sequence";
import { cue, marker, metadata, region, timeSignature, tuning } from "./metadata";

describe("metadata", () => {
	it("wraps a child with metadata", () => {
		const child = sequence(N.C4(4));
		const m = metadata(child, { name: "intro" });
		expect(m.properties.meta.name).toBe("intro");
		expect(m.startBeat).toBe(0);
		expect(m.endBeat).toBe(4);
		expect(m.children).toHaveLength(1);
	});

	it("has correct packageName and unitName", () => {
		const m = metadata(sequence(N.C4(1)), { name: "test" });
		expect(m.packageName).toBe("@resequence/patterns-core");
		expect(m.unitName).toBe("metadata");
	});
});

describe("timeSignature", () => {
	it("creates metadata with time signature", () => {
		const child = sequence(N.C4(4));
		const m = timeSignature(child, [3, 4]);
		expect(m.properties.meta.timeSignature).toEqual([3, 4]);
	});

	it("throws on invalid time signature", () => {
		const child = sequence(N.C4(1));
		expect(() => timeSignature(child, [0, 4])).toThrow(PatternsError);
		expect(() => timeSignature(child, [4, 0])).toThrow(PatternsError);
	});
});

describe("marker", () => {
	it("creates metadata with marker", () => {
		const child = sequence(N.C4(4));
		const m = marker(child, "chorus");
		expect(m.properties.meta.marker).toBe("chorus");
	});
});

describe("cue", () => {
	it("is an alias for marker", () => {
		expect(cue).toBe(marker);
	});
});

describe("region", () => {
	it("creates metadata with region", () => {
		const child = sequence(N.C4(4));
		const m = region(child, "verse1");
		expect(m.properties.meta.region).toBe("verse1");
	});
});

describe("tuning", () => {
	it("creates metadata with tuning", () => {
		const child = sequence(N.C4(4));
		const mockTuning = {
			classes: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
			frequencies: [261.63],
			referenceOctave: 4,
			octaveRatio: 2,
		};
		const m = tuning(child, mockTuning);
		expect(m.properties.meta.tuning).toBe(mockTuning);
	});
});
