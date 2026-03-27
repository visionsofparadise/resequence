import { describe, expect, it } from "vitest";
import { MidiUnit } from "./midi";
import type { MidiUnitProperties } from "./midi";

class TestMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "test"] as const;

	clone(overrides?: Partial<MidiUnitProperties>): TestMidiUnit {
		return new TestMidiUnit({ ...this.properties, ...overrides });
	}
}

describe("MidiUnit", () => {
	it("is identifiable via static is()", () => {
		const unit = new TestMidiUnit();
		expect(MidiUnit.is(unit)).toBe(true);
		expect(MidiUnit.is({})).toBe(false);
	});

	it("noteMod() does not mutate a clone's noteModDeclarations array", () => {
		const original = new TestMidiUnit();
		original.noteMod("velocity", ["path.a"]);

		const cloned = original.clone();
		original.noteMod("pitch", ["path.b"]);

		expect(original.properties.noteModDeclarations).toHaveLength(2);
		expect(cloned.properties.noteModDeclarations).toHaveLength(1);
		expect(cloned.properties.noteModDeclarations[0]?.property).toBe("velocity");
	});
});
