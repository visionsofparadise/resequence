import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import { collectTimeSignatures } from "../rendering/collect-time-signatures";
import { N } from "../tunings/chromatic";
import { MetadataPattern, timeSignature } from "./metadata";
import { sequence } from "./sequence";

describe("timeSignature alias", () => {
	it("creates MetadataPattern with timeSignature", () => {
		const pattern = timeSignature(sequence(N.C4(1)), [3, 4]);
		expect(pattern).toBeInstanceOf(MetadataPattern);
		expect(pattern.endBeat - pattern.startBeat).toBe(1);
		expect(pattern.meta.timeSignature).toEqual([3, 4]);
	});

	it("throws for invalid numerator", () => {
		expect(() => timeSignature(sequence(N.C4(1)), [0, 4])).toThrow(ResequenceError);
	});
});

describe("collectTimeSignatures", () => {
	it("returns empty array when no timeSignature wrappers present", () => {
		expect(collectTimeSignatures(sequence(N.C4(1)))).toEqual([]);
	});

	it("captures single timeSignature at root", () => {
		const result = collectTimeSignatures(timeSignature(sequence(N.C4(1)), [3, 4]));
		expect(result).toEqual([{ beat: 0, timeSignature: [3, 4] }]);
	});

	it("captures nested timeSignature inside sequence at correct beat offset", () => {
		const pattern = sequence(N.C4(1), timeSignature(sequence(N.E4(1)), [5, 8]));
		const result = collectTimeSignatures(pattern);
		expect(result).toEqual([{ beat: 1, timeSignature: [5, 8] }]);
	});
});
