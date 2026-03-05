import { describe, expect, it, vi } from "vitest";
import { MidiUnit } from "./midi-unit";
import type { MidiUnitProperties } from "./midi-unit";
import type { NoteEvent } from "./note-event";
import type { UnitContext } from "./context";
import type { SetupResult } from "./unit";

class TestMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "test"] as const;
	scheduledNotes: Array<NoteEvent> = [];

	clone(overrides?: Partial<MidiUnitProperties>): TestMidiUnit {
		return new TestMidiUnit({ ...this.properties, ...overrides });
	}

	protected override _schedule(noteEvent: NoteEvent, _context: UnitContext): void {
		this.scheduledNotes.push(noteEvent);
	}

	protected override _setup(_context: UnitContext): SetupResult {
		const node = { connect: () => {}, disconnect: () => {} } as unknown as AudioNode;
		return { entries: [node], exits: [node] };
	}
}

function mockContext(): UnitContext {
	return {
		audioContext: {} as BaseAudioContext,
		driverMap: new Map(),
		getSample: () => Promise.resolve({} as AudioBuffer),
		loadModule: () => Promise.resolve(),
	};
}

function makeNote(overrides?: Partial<NoteEvent>): NoteEvent {
	return {
		startMs: 0,
		stopMs: 500,
		cleanupMs: 500,
		note: 60,
		velocity: 100,
		bend: 0,
		frequency: 261.63,
		...overrides,
	};
}

describe("MidiUnit", () => {
	it("is identifiable via static is()", () => {
		const unit = new TestMidiUnit();
		expect(MidiUnit.is(unit)).toBe(true);
	});

	it("schedule calls _schedule and forwards to MidiUnit targets", () => {
		const unitA = new TestMidiUnit();
		const unitB = new TestMidiUnit();
		unitA.to(unitB);
		unitA.setup(mockContext());
		unitB.setup(mockContext());

		const note = makeNote();
		unitA.schedule(note, mockContext());

		expect(unitA.scheduledNotes).toHaveLength(1);
		expect(unitB.scheduledNotes).toHaveLength(1);
	});

	it("noteMod registers declarations", () => {
		const unit = new TestMidiUnit();
		unit.noteMod("velocity", ["path.vel"]);
		expect(unit.properties.noteModDeclarations).toHaveLength(1);
		expect(unit.properties.noteModDeclarations[0]?.property).toBe("velocity");
	});

	it("applyNoteMods writes velocity to drivers", () => {
		const unit = new TestMidiUnit();
		unit.noteMod("velocity", ["test.vel"]);

		const mockNode = {
			offset: {
				value: 0,
				setValueAtTime: vi.fn(),
			},
		};
		const context = mockContext();
		context.driverMap.set("test.vel", { node: mockNode as unknown as ConstantSourceNode });

		const note = makeNote({ velocity: 127 });
		unit.schedule(note, context);

		expect(mockNode.offset.setValueAtTime).toHaveBeenCalledWith(1, 0);
	});

	it("gate noteMod sets value at start and clears at stop", () => {
		const unit = new TestMidiUnit();
		unit.noteMod("gate", ["test.gate"]);

		const mockNode = {
			offset: {
				value: 0,
				setValueAtTime: vi.fn(),
			},
		};
		const context = mockContext();
		context.driverMap.set("test.gate", { node: mockNode as unknown as ConstantSourceNode });

		const note = makeNote({ startMs: 1000, stopMs: 2000 });
		unit.schedule(note, context);

		expect(mockNode.offset.setValueAtTime).toHaveBeenCalledWith(1, 1);
		expect(mockNode.offset.setValueAtTime).toHaveBeenCalledWith(0, 2);
	});
});
