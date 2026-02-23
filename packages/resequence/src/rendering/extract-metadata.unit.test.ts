import { describe, expect, it } from "vitest";
import { extractMetadata } from "./extract-metadata";
import { metadata } from "../patterns/metadata";
import { note } from "../patterns/note";
import { sequence } from "../patterns/sequence";
import { layer } from "../patterns/layer";

describe("extractMetadata", () => {
	it("returns defaults when no metadata present", () => {
		const pattern = note("C4", "4n");
		const result = extractMetadata(pattern);

		expect(result.tempo).toBe(120);
		expect(result.key).toBeUndefined();
		expect(result.timeSignature).toEqual([4, 4]);
	});

	it("extracts tempo, key, and timeSignature from metadata wrapper", () => {
		const pattern = metadata(note("C4", "4n"), { tempo: 140, key: "Dm", timeSignature: [3, 4] });
		const result = extractMetadata(pattern);

		expect(result.tempo).toBe(140);
		expect(result.key).toBe("Dm");
		expect(result.timeSignature).toEqual([3, 4]);
	});

	it("applies defaults for missing metadata fields", () => {
		const pattern = metadata(note("C4", "4n"), { key: "Am" });
		const result = extractMetadata(pattern);

		expect(result.tempo).toBe(120);
		expect(result.key).toBe("Am");
		expect(result.timeSignature).toEqual([4, 4]);
	});

	it("uses outermost metadata when nested", () => {
		const inner = metadata(note("C4", "4n"), { tempo: 90, key: "Gm" });
		const outer = metadata(inner, { tempo: 140, key: "Am" });
		const result = extractMetadata(outer);

		expect(result.tempo).toBe(140);
		expect(result.key).toBe("Am");
	});

	it("finds metadata inside sequence", () => {
		const pattern = sequence(note("C4", "4n"), metadata(note("D4", "4n"), { tempo: 100 }));
		const result = extractMetadata(pattern);

		expect(result.tempo).toBe(100);
	});

	it("finds metadata inside layer", () => {
		const pattern = layer(note("C4", "4n"), metadata(note("D4", "4n"), { tempo: 88 }));
		const result = extractMetadata(pattern);

		expect(result.tempo).toBe(88);
	});
});
