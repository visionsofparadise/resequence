import { describe, expect, it } from "vitest";
import type { MetadataEvent } from "@resequence/patterns-core";
import { beatsToSeconds, buildTempoMap, collectMetadata, collectTempoPoints, secondsToBeats } from "./tempo-map";
import type { TempoPoint } from "./tempo-map";

describe("buildTempoMap", () => {
	it("builds from static BPM events", () => {
		const events: Array<MetadataEvent> = [
			{ type: "metadata", absoluteBeat: 0, bpm: 120 },
			{ type: "metadata", absoluteBeat: 16, bpm: 140 },
		];
		const map = buildTempoMap(events);
		expect(map).toEqual([
			{ beat: 0, bpm: 120 },
			{ beat: 16, bpm: 140 },
		]);
	});

	it("ignores events without bpm", () => {
		const events: Array<MetadataEvent> = [
			{ type: "metadata", absoluteBeat: 0, marker: "intro" },
			{ type: "metadata", absoluteBeat: 0, bpm: 120 },
		];
		const map = buildTempoMap(events);
		expect(map).toHaveLength(1);
		expect(map[0]?.bpm).toBe(120);
	});

	it("returns empty for no tempo events", () => {
		expect(buildTempoMap([])).toEqual([]);
	});
});

describe("collectTempoPoints", () => {
	it("handles keyframe curves with sampling", () => {
		const entries: Array<TempoPoint> = [];
		collectTempoPoints(120, [{ beat: 1, value: 0.14, curve: 0.5 }], 0, entries);
		expect(entries.length).toBeGreaterThan(2);
		expect(entries[0]?.bpm).toBe(120);
	});

	it("handles step keyframes", () => {
		const entries: Array<TempoPoint> = [];
		collectTempoPoints(120, [{ beat: 4, value: 0.14, step: true }], 0, entries);
		expect(entries).toEqual([
			{ beat: 0, bpm: 120 },
			{ beat: 4, bpm: 140 },
		]);
	});
});

describe("beatsToSeconds", () => {
	it("converts at constant tempo", () => {
		const map = [{ beat: 0, bpm: 120 }];
		expect(beatsToSeconds(4, map)).toBeCloseTo(2, 5);
	});

	it("converts across tempo change", () => {
		const map = [
			{ beat: 0, bpm: 120 },
			{ beat: 4, bpm: 60 },
		];
		const first4 = beatsToSeconds(4, map);
		expect(first4).toBeCloseTo(2, 5);
		const at8 = beatsToSeconds(8, map);
		expect(at8).toBeCloseTo(6, 5);
	});

	it("returns 0 for beat 0", () => {
		expect(beatsToSeconds(0, [{ beat: 0, bpm: 120 }])).toBe(0);
	});

	it("defaults to 120 BPM with empty map", () => {
		expect(beatsToSeconds(4, [])).toBeCloseTo(2, 5);
	});
});

describe("secondsToBeats", () => {
	it("converts at constant tempo", () => {
		const map = [{ beat: 0, bpm: 120 }];
		expect(secondsToBeats(0, 2, map)).toBeCloseTo(4, 5);
	});

	it("converts across tempo change", () => {
		const map = [
			{ beat: 0, bpm: 120 },
			{ beat: 4, bpm: 60 },
		];
		expect(secondsToBeats(0, 6, map)).toBeCloseTo(8, 5);
	});

	it("starts from a non-zero beat", () => {
		const map = [{ beat: 0, bpm: 120 }];
		expect(secondsToBeats(4, 1, map)).toBeCloseTo(6, 5);
	});
});

describe("collectMetadata", () => {
	it("collects markers, time signatures, regions, and tempo", () => {
		const events: Array<MetadataEvent> = [
			{ type: "metadata", absoluteBeat: 0, bpm: 120 },
			{ type: "metadata", absoluteBeat: 0, marker: "intro" },
			{ type: "metadata", absoluteBeat: 0, timeSignature: [4, 4] as const },
			{ type: "metadata", absoluteBeat: 0, region: "verse", regionEndBeat: 16 },
		];
		const result = collectMetadata(events);
		expect(result.tempoMap).toHaveLength(1);
		expect(result.markers).toEqual([{ beat: 0, name: "intro" }]);
		expect(result.timeSignatures).toEqual([{ beat: 0, timeSignature: [4, 4] }]);
		expect(result.regions).toEqual([{ name: "verse", startBeat: 0, endBeat: 16 }]);
	});
});
