import { describe, expect, it } from "vitest";
import { z } from "zod";
import { MidiUnit } from "./midi";

const emptySchema = z.object({});

class TestMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "test"] as const;

	constructor() {
		super({}, emptySchema);
	}
}

describe("MidiUnit", () => {
	it("is identifiable via static is()", () => {
		const unit = new TestMidiUnit();
		expect(MidiUnit.is(unit)).toBe(true);
		expect(MidiUnit.is({})).toBe(false);
	});
});
