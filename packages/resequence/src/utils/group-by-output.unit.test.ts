import { describe, expect, it } from "vitest";
import type { PositionedNote } from "../patterns/pattern";
import { groupByOutput } from "./group-by-output";

describe("groupByOutput", () => {
	it("groups notes with the same trackName together", () => {
		const notes: ReadonlyArray<PositionedNote> = [
			{ tick: 0, pitch: 60, trackName: "bass" },
			{ tick: 480, pitch: 62, trackName: "bass" },
			{ tick: 0, pitch: 67, trackName: "pad" },
		];
		const groups = groupByOutput(notes);
		expect(groups.get("bass")).toHaveLength(2);
		expect(groups.get("pad")).toHaveLength(1);
	});

	it("groups notes with different trackNames in separate groups", () => {
		const notes: ReadonlyArray<PositionedNote> = [
			{ tick: 0, pitch: 60, trackName: "bass" },
			{ tick: 0, pitch: 67, trackName: "pad" },
		];
		const groups = groupByOutput(notes);
		expect(groups.size).toBe(2);
	});

	it("groups notes with no trackName under empty string key", () => {
		const notes: ReadonlyArray<PositionedNote> = [
			{ tick: 0, pitch: 60 },
			{ tick: 480, pitch: 62 },
		];
		const groups = groupByOutput(notes);
		expect(groups.get("")).toHaveLength(2);
	});

	it("returns empty map for empty input", () => {
		expect(groupByOutput([])).toEqual(new Map());
	});
});
