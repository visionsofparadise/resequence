import { describe, expect, it } from "vitest";
import { extractMetadata } from "./extract-metadata";
import { metadata } from "../patterns/metadata";
import { sequence } from "../patterns/sequence";
import { layer } from "../patterns/layer";
import { N } from "../tunings/chromatic";

describe("extractMetadata", () => {
	it("returns empty object when no metadata present", () => {
		const pattern = sequence(N.C4(1));
		const result = extractMetadata(pattern);

		expect(result.name).toBeUndefined();
		expect(result.description).toBeUndefined();
	});

	it("extracts name and description from metadata wrapper", () => {
		const pattern = metadata(sequence(N.C4(1)), { name: "My Track", description: "A test" });
		const result = extractMetadata(pattern);

		expect(result.name).toBe("My Track");
		expect(result.description).toBe("A test");
	});

	it("applies defaults for missing metadata fields", () => {
		const pattern = metadata(sequence(N.C4(1)), { name: "Only Name" });
		const result = extractMetadata(pattern);

		expect(result.name).toBe("Only Name");
		expect(result.description).toBeUndefined();
	});

	it("uses outermost metadata when nested", () => {
		const inner = metadata(sequence(N.C4(1)), { name: "inner" });
		const outer = metadata(inner, { name: "outer" });
		const result = extractMetadata(outer);

		expect(result.name).toBe("outer");
	});

	it("finds metadata inside sequence", () => {
		const pattern = sequence(N.C4(1), metadata(sequence(N.D4(1)), { name: "seq-meta" }));
		const result = extractMetadata(pattern);

		expect(result.name).toBe("seq-meta");
	});

	it("finds metadata inside layer", () => {
		const pattern = layer(sequence(N.C4(1)), metadata(sequence(N.D4(1)), { name: "layer-meta" }));
		const result = extractMetadata(pattern);

		expect(result.name).toBe("layer-meta");
	});
});
