import { describe, expect, it } from "vitest";
import { collectMetadata } from "../rendering/pattern-metadata";
import { N } from "../tunings/chromatic";
import { metadata } from "./metadata";
import { sequence } from "./sequence";

describe("MetadataPattern", () => {
	describe("creation", () => {
		it("wraps pattern with name and description", () => {
			const m = metadata(sequence(N.C4(1)), { name: "My Song", description: "A test song" });
			expect(m).toBeInstanceOf(m.constructor);
			expect(m.properties.meta.name).toBe("My Song");
			expect(m.properties.meta.description).toBe("A test song");
		});

		it("supports empty config", () => {
			const m = metadata(sequence(N.C4(1)), {});
			expect(m.properties.meta.name).toBeUndefined();
			expect(m.properties.meta.description).toBeUndefined();
		});
	});

	describe("markers", () => {
		it("includes own marker at beat 0", () => {
			const m = metadata(sequence(N.C4(1)), { marker: "test" });
			expect(collectMetadata(m).markers).toEqual([{ beat: 0, name: "test" }]);
		});
	});
});
