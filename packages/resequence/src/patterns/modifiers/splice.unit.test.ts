import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { pitchToMidi } from "../../utils/pitch";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { insert, splice } from "./splice";

describe("splice", () => {
	it("removes notes at the specified index", () => {
		const pat = splice(sequence(N.C4(1), N.E4(1), N.G4(1)), { at: 1, remove: 1 });
		expect(collectNotes(pat)).toHaveLength(2);
		const midiPitches = collectNotes(pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note);
		expect(midiPitches).not.toContain(64);
	});

	it("inserts notes at the specified position", () => {
		const pat = splice(sequence(N.C4(1), N.G4(1)), {
			at: 1,
			insert: sequence(N.D4(1)),
		});
		expect(collectNotes(pat)).toHaveLength(3);
		expect(collectNotes(pat)[1]).toMatchObject({ pitch: N.D4, startBeat: 1 });
	});

	it("shifts notes after the splice point", () => {
		const pat = splice(sequence(N.C4(1), N.E4(1), N.G4(1)), {
			at: 1,
			remove: 1,
			insert: sequence(N.D4(0.5)),
		});
		expect(collectNotes(pat)[2]).toMatchObject({ pitch: N.G4, startBeat: 1.5 });
	});

	it("adjusts duration for the difference between removed and inserted spans", () => {
		const pat = splice(sequence(N.C4(1), N.E4(1)), {
			at: 0,
			remove: 1,
			insert: sequence(N.D4(0.5)),
		});
		expect(pat.endBeat - pat.startBeat).toBe(1.5);
	});
});

describe("insert", () => {
	it("inserts notes at the specified beat", () => {
		const pat = insert(sequence(N.C4(1), N.G4(1)), {
			at: 1,
			insert: sequence(N.D4(0.5)),
		});
		const midiPitches = collectNotes(pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note);
		expect(midiPitches).toContain(62);
	});

	it("removes notes in the time window and shifts subsequent notes", () => {
		const pat = insert(sequence(N.C4(1), N.E4(1), N.G4(1)), {
			at: 1,
			remove: 1,
		});
		const beats = collectNotes(pat).map((positionedNote) => positionedNote.startBeat);
		expect(beats).not.toContain(2);
	});
});
