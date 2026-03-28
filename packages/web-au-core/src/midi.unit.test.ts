import { describe, expect, it } from "vitest";
import { MidiUnit } from "./midi";

class TestMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "test"] as const;
}

describe("MidiUnit", () => {
	it("is identifiable via static is()", () => {
		const unit = new TestMidiUnit();
		expect(MidiUnit.is(unit)).toBe(true);
		expect(MidiUnit.is({})).toBe(false);
	});
});
