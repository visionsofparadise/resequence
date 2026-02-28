import { describe, expect, it } from "vitest";
import { extractMetadata } from "./extract-metadata";
import { metadata } from "../patterns/metadata";
import { note } from "../patterns/note";
import { sequence } from "../patterns/sequence";
import { layer } from "../patterns/layer";
import { resolveDuration } from "../utils/duration";
import { resolvePitch } from "../utils/pitch";

describe("extractMetadata", () => {
	it("returns empty object when no metadata present", () => {
		const pattern = sequence(note(resolvePitch("C4"), resolveDuration("4n")));
		const result = extractMetadata(pattern);

		expect(result.name).toBeUndefined();
		expect(result.description).toBeUndefined();
	});

	it("extracts name and description from metadata wrapper", () => {
		const pattern = metadata(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), { name: "My Track", description: "A test" });
		const result = extractMetadata(pattern);

		expect(result.name).toBe("My Track");
		expect(result.description).toBe("A test");
	});

	it("applies defaults for missing metadata fields", () => {
		const pattern = metadata(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), { name: "Only Name" });
		const result = extractMetadata(pattern);

		expect(result.name).toBe("Only Name");
		expect(result.description).toBeUndefined();
	});

	it("uses outermost metadata when nested", () => {
		const inner = metadata(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), { name: "inner" });
		const outer = metadata(inner, { name: "outer" });
		const result = extractMetadata(outer);

		expect(result.name).toBe("outer");
	});

	it("finds metadata inside sequence", () => {
		const pattern = sequence(note(resolvePitch("C4"), resolveDuration("4n")), metadata(sequence(note(resolvePitch("D4"), resolveDuration("4n"))), { name: "seq-meta" }));
		const result = extractMetadata(pattern);

		expect(result.name).toBe("seq-meta");
	});

	it("finds metadata inside layer", () => {
		const pattern = layer(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), metadata(sequence(note(resolvePitch("D4"), resolveDuration("4n"))), { name: "layer-meta" }));
		const result = extractMetadata(pattern);

		expect(result.name).toBe("layer-meta");
	});
});
