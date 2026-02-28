import { describe, expect, it } from "vitest";
import { marker } from "../patterns/metadata";
import { tempo } from "../patterns/tempo";
import { note } from "../patterns/note";
import { sequence } from "../patterns/sequence";
import { layer } from "../patterns/layer";
import { resolveDuration } from "../utils/duration";
import { resolvePitch } from "../utils/pitch";
import { collectMarkers } from "./collect-markers";

describe("collectMarkers", () => {
	it("returns empty array when no markers present", () => {
		expect(collectMarkers(sequence(note(resolvePitch("C4"), resolveDuration("4n"))))).toEqual([]);
	});

	it("captures single marker at root", () => {
		const result = collectMarkers(marker(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), "intro"));
		expect(result).toEqual([{ beat: 0, name: "intro" }]);
	});

	it("captures marker inside sequence at correct tick offset", () => {
		const pattern = sequence(note(resolvePitch("C4"), resolveDuration("4n")), marker(sequence(note(resolvePitch("E4"), resolveDuration("4n"))), "verse"));
		const result = collectMarkers(pattern);
		expect(result).toEqual([{ beat: 1, name: "verse" }]);
	});

	it("captures multiple markers in sequence", () => {
		const pattern = sequence(
			marker(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), "intro"),
			marker(sequence(note(resolvePitch("E4"), resolveDuration("4n"))), "verse"),
			marker(sequence(note(resolvePitch("G4"), resolveDuration("4n"))), "chorus"),
		);
		const result = collectMarkers(pattern);
		expect(result).toEqual([
			{ beat: 0, name: "intro" },
			{ beat: 1, name: "verse" },
			{ beat: 2, name: "chorus" },
		]);
	});

	it("captures marker inside layer at same offset", () => {
		const pattern = layer(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), marker(sequence(note(resolvePitch("E4"), resolveDuration("4n"))), "drop"));
		const result = collectMarkers(pattern);
		expect(result).toEqual([{ beat: 0, name: "drop" }]);
	});

	it("traverses through tempo wrapper", () => {
		const pattern = tempo(marker(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), "start"), 140);
		const result = collectMarkers(pattern);
		expect(result).toEqual([{ beat: 0, name: "start" }]);
	});

	it("returns markers sorted by tick", () => {
		const pattern = layer(
			sequence(note(resolvePitch("C4"), resolveDuration("4n")), marker(sequence(note(resolvePitch("E4"), resolveDuration("4n"))), "b")),
			marker(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), "a"),
		);
		const result = collectMarkers(pattern);
		expect(result[0]).toEqual({ beat: 0, name: "a" });
		expect(result[1]).toEqual({ beat: 1, name: "b" });
	});
});
