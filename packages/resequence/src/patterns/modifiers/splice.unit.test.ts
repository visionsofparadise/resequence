import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { pitchToMidi } from "../../utils/pitch";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { InsertPattern, SplicePattern, insert, splice } from "./splice";

describe("splice", () => {
	describe("notes", () => {
		it("removes notes at the specified index", () => {
			// 3 notes: C4, E4, G4. Remove index 1 (E4)
			const pat = splice(sequence(N.C4(1), N.E4(1), N.G4(1)), { at: 1, remove: 1 });
			expect(collectNotes(pat)).toHaveLength(2);
			const midiPitches = collectNotes(pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note);
			expect(midiPitches).not.toContain(64); // E4 removed
		});

		it("inserts notes at the specified position", () => {
			// 2 notes. Insert D4 (4n) at index 1
			const pat = splice(sequence(N.C4(1), N.G4(1)), {
				at: 1,
				insert: sequence(N.D4(1)),
			});
			expect(collectNotes(pat)).toHaveLength(3);
			expect(collectNotes(pat)[1]).toMatchObject({ pitch: N.D4, startBeat: 1 }); // D4 at beat 1
		});

		it("shifts notes after the splice point", () => {
			// Replace E4 (dur 1) with shorter D4 (dur 0.5) → following notes shift left by 0.5
			const pat = splice(sequence(N.C4(1), N.E4(1), N.G4(1)), {
				at: 1,
				remove: 1,
				insert: sequence(N.D4(0.5)),
			});
			// G4 was at beat 2, shift = 0.5-1 = -0.5 → now at beat 1.5
			expect(collectNotes(pat)[2]).toMatchObject({ pitch: N.G4, startBeat: 1.5 });
		});
	});

	describe("durationBeats", () => {
		it("adjusts for the difference between removed and inserted spans", () => {
			// Remove 1 note of 1 beat, insert 1 note of 0.5 beats → duration shrinks by 0.5
			const pat = splice(sequence(N.C4(1), N.E4(1)), {
				at: 0,
				remove: 1,
				insert: sequence(N.D4(0.5)),
			});
			expect(pat.endBeat - pat.startBeat).toBe(1.5); // 2 - 1 + 0.5
		});
	});

	describe("instanceof", () => {
		it("is a SplicePattern", () => {
			expect(splice(sequence(N.C4(1)), { at: 0 })).toBeInstanceOf(SplicePattern);
		});
	});
});

describe("insert", () => {
	describe("notes", () => {
		it("inserts notes at the specified beat", () => {
			// 2 notes. Insert D4 at beat 1
			const pat = insert(sequence(N.C4(1), N.G4(1)), {
				at: 1,
				insert: sequence(N.D4(0.5)),
			});
			// D4 inserted at beat 1
			const midiPitches = collectNotes(pat).map((positionedNote) => pitchToMidi(positionedNote.pitch).note);
			expect(midiPitches).toContain(62); // D4 present
		});

		it("removes notes in the time window and shifts subsequent notes", () => {
			// 3 notes at 0, 1, 2. Remove 1 beat starting at beat 1 (removes E4)
			const pat = insert(sequence(N.C4(1), N.E4(1), N.G4(1)), {
				at: 1,
				remove: 1,
			});
			// E4 at [1,2) removed. G4 at 2 shifts by -1 → beat 1
			const beats = collectNotes(pat).map((positionedNote) => positionedNote.startBeat);
			expect(beats).not.toContain(2); // G4 shifted away from beat 2
		});
	});

	describe("durationBeats", () => {
		it("adjusts for inserted duration minus removed duration", () => {
			// Remove 1 beat, insert 0.5 beats → duration shrinks by 0.5
			const pat = insert(sequence(N.C4(1), N.E4(1)), {
				at: 0,
				remove: 1,
				insert: sequence(N.D4(0.5)),
			});
			expect(pat.endBeat - pat.startBeat).toBe(1.5); // 2 - 1 + 0.5
		});
	});

	describe("instanceof", () => {
		it("is an InsertPattern", () => {
			expect(insert(sequence(N.C4(1)), { at: 0 })).toBeInstanceOf(InsertPattern);
		});
	});
});
