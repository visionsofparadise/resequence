import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import { collectTimeSignatures } from "../rendering/collect-time-signatures";
import { MetadataPattern, timeSignature } from "./metadata";
import { note } from "./note";
import { sequence } from "./sequence";
import { layer } from "./layer";
import { repeat } from "./repeat";

describe("timeSignature alias", () => {
	it("creates MetadataPattern with timeSignature", () => {
		const pattern = timeSignature(note("C4", "4n"), [3, 4]);
		expect(pattern).toBeInstanceOf(MetadataPattern);
		expect(pattern.durationBeats).toBe(1);
		expect(pattern.meta.timeSignature).toEqual([3, 4]);
	});

	it("throws for invalid numerator", () => {
		expect(() => timeSignature(note("C4", "4n"), [0, 4])).toThrow(ResequenceError);
	});

	it("throws for invalid denominator", () => {
		expect(() => timeSignature(note("C4", "4n"), [4, 0])).toThrow(ResequenceError);
	});

	it("notes delegates to child", () => {
		const child = note("C4", "4n");
		const pattern = timeSignature(child, [3, 4]);
		expect(pattern.notes).toBe(child.notes);
	});
});

describe("collectTimeSignatures", () => {
	it("returns empty array when no timeSignature wrappers present", () => {
		expect(collectTimeSignatures(note("C4", "4n").metadatas)).toEqual([]);
	});

	it("captures single timeSignature at root", () => {
		const result = collectTimeSignatures(timeSignature(note("C4", "4n"), [3, 4]).metadatas);
		expect(result).toEqual([{ beat: 0, timeSignature: [3, 4] }]);
	});

	it("captures nested timeSignature inside sequence at correct beat offset", () => {
		const pattern = sequence(note("C4", "4n"), timeSignature(note("E4", "4n"), [5, 8]));
		const result = collectTimeSignatures(pattern.metadatas);
		expect(result).toEqual([{ beat: 1, timeSignature: [5, 8] }]);
	});

	it("captures multiple timeSignature wrappers in sequence", () => {
		const pattern = sequence(
			timeSignature(note("C4", "4n"), [3, 4]),
			timeSignature(note("E4", "4n"), [5, 8]),
			timeSignature(note("G4", "4n"), [4, 4]),
		);
		const result = collectTimeSignatures(pattern.metadatas);
		expect(result).toEqual([
			{ beat: 0, timeSignature: [3, 4] },
			{ beat: 1, timeSignature: [5, 8] },
			{ beat: 2, timeSignature: [4, 4] },
		]);
	});

	it("captures timeSignature inside layer at same offset", () => {
		const pattern = layer(note("C4", "4n"), timeSignature(note("E4", "4n"), [6, 8]));
		const result = collectTimeSignatures(pattern.metadatas);
		expect(result).toEqual([{ beat: 0, timeSignature: [6, 8] }]);
	});

	it("captures timeSignature inside repeat at each iteration offset", () => {
		const pattern = repeat(timeSignature(note("C4", "4n"), [3, 4]), 3);
		const result = collectTimeSignatures(pattern.metadatas);
		expect(result).toEqual([
			{ beat: 0, timeSignature: [3, 4] },
			{ beat: 1, timeSignature: [3, 4] },
			{ beat: 2, timeSignature: [3, 4] },
		]);
	});
});
