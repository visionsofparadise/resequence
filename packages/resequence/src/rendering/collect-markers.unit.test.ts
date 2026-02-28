import { describe, expect, it } from "vitest";
import { marker } from "../patterns/metadata";
import { sequence } from "../patterns/sequence";
import { layer } from "../patterns/layer";
import { N } from "../tunings/chromatic";
import { collectMarkers } from "./collect-markers";

describe("collectMarkers", () => {
	it("returns empty array when no markers present", () => {
		expect(collectMarkers(sequence(N.C4(1)))).toEqual([]);
	});

	it("captures single marker at root", () => {
		const result = collectMarkers(marker(sequence(N.C4(1)), "intro"));
		expect(result).toEqual([{ beat: 0, name: "intro" }]);
	});

	it("captures marker inside sequence at correct tick offset", () => {
		const pattern = sequence(N.C4(1), marker(sequence(N.E4(1)), "verse"));
		const result = collectMarkers(pattern);
		expect(result).toEqual([{ beat: 1, name: "verse" }]);
	});

	it("returns markers sorted by tick", () => {
		const pattern = layer(
			sequence(N.C4(1), marker(sequence(N.E4(1)), "b")),
			marker(sequence(N.C4(1)), "a"),
		);
		const result = collectMarkers(pattern);
		expect(result[0]).toEqual({ beat: 0, name: "a" });
		expect(result[1]).toEqual({ beat: 1, name: "b" });
	});
});
