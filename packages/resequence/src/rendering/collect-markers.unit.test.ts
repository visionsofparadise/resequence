import { describe, expect, it } from "vitest";
import { note } from "../patterns/note";
import { sequence } from "../patterns/sequence";
import { layer } from "../patterns/layer";
import { marker } from "../patterns/marker";
import { tempo } from "../patterns/tempo";
import { collectMarkers } from "./collect-markers";

describe("collectMarkers", () => {
	it("returns empty array when no markers present", () => {
		expect(collectMarkers(note("C4", "4n"))).toEqual([]);
	});

	it("captures single marker at root", () => {
		const result = collectMarkers(marker(note("C4", "4n"), "intro"));
		expect(result).toEqual([{ beat: 0, name: "intro" }]);
	});

	it("captures marker inside sequence at correct tick offset", () => {
		const pattern = sequence(note("C4", "4n"), marker(note("E4", "4n"), "verse"));
		const result = collectMarkers(pattern);
		expect(result).toEqual([{ beat: 1, name: "verse" }]);
	});

	it("captures multiple markers in sequence", () => {
		const pattern = sequence(
			marker(note("C4", "4n"), "intro"),
			marker(note("E4", "4n"), "verse"),
			marker(note("G4", "4n"), "chorus"),
		);
		const result = collectMarkers(pattern);
		expect(result).toEqual([
			{ beat: 0, name: "intro" },
			{ beat: 1, name: "verse" },
			{ beat: 2, name: "chorus" },
		]);
	});

	it("captures marker inside layer at same offset", () => {
		const pattern = layer(note("C4", "4n"), marker(note("E4", "4n"), "drop"));
		const result = collectMarkers(pattern);
		expect(result).toEqual([{ beat: 0, name: "drop" }]);
	});

	it("traverses through tempo wrapper", () => {
		const pattern = tempo(marker(note("C4", "4n"), "start"), 140);
		const result = collectMarkers(pattern);
		expect(result).toEqual([{ beat: 0, name: "start" }]);
	});

	it("returns markers sorted by tick", () => {
		const pattern = layer(
			sequence(note("C4", "4n"), marker(note("E4", "4n"), "b")),
			marker(note("C4", "4n"), "a"),
		);
		const result = collectMarkers(pattern);
		expect(result[0]).toEqual({ beat: 0, name: "a" });
		expect(result[1]).toEqual({ beat: 1, name: "b" });
	});
});
