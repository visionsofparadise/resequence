import { describe, expect, it } from "vitest";
import { collectMarkers } from "../rendering/collect-markers";
import { N } from "../tunings/chromatic";
import { metadata } from "./metadata";
import { sequence } from "./sequence";

describe("MetadataPattern", () => {
	describe("creation", () => {
		it("wraps pattern with name and description", () => {
			const m = metadata(sequence(N.C4(1)), { name: "My Song", description: "A test song" });
			expect(m).toBeInstanceOf(m.constructor);
			expect(m.meta.name).toBe("My Song");
			expect(m.meta.description).toBe("A test song");
		});

		it("supports empty config", () => {
			const m = metadata(sequence(N.C4(1)), {});
			expect(m.meta.name).toBeUndefined();
			expect(m.meta.description).toBeUndefined();
		});
	});

	describe("markers", () => {
		it("includes own marker at beat 0", () => {
			const m = metadata(sequence(N.C4(1)), { marker: "test" });
			expect(collectMarkers(m)).toEqual([{ beat: 0, name: "test" }]);
		});
	});
});
