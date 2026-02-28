import { describe, expect, it } from "vitest";
import { N } from "../tunings/chromatic";
import { marker, MetadataPattern } from "./metadata";
import { sequence } from "./sequence";

describe("marker alias", () => {
	it("creates MetadataPattern with marker name", () => {
		const m = marker(sequence(N.C4(1)), "intro");
		expect(m).toBeInstanceOf(MetadataPattern);
		expect(m.meta.marker).toBe("intro");
	});
});
