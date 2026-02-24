import { describe, expect, it } from "vitest";
import { note } from "../note";
import { sequence } from "../sequence";
import { InsertPattern, SplicePattern, insert, splice } from "./splice";

describe("splice", () => {
	describe("notes", () => {
		it("removes notes at the specified index", () => {
			// 3 notes: C4, E4, G4. Remove index 1 (E4)
			const pat = splice(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), { at: 1, remove: 1 });
			expect(pat.notes).toHaveLength(2);
			const pitches = pat.notes.map((positionedNote) => positionedNote.pitch);
			expect(pitches).not.toContain(64); // E4 removed
		});

		it("inserts notes at the specified position", () => {
			// 2 notes. Insert D4 (4n) at index 1
			const pat = splice(sequence(note("C4", "4n"), note("G4", "4n")), {
				at: 1,
				insert: note("D4", "4n"),
			});
			expect(pat.notes).toHaveLength(3);
			expect(pat.notes[1]).toMatchObject({ pitch: 62, tick: 480 }); // D4 at tick 480
		});

		it("shifts notes after the splice point", () => {
			// Replace E4 (dur 480) with shorter D4 (dur 240) → following notes shift left by 240
			const pat = splice(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), {
				at: 1,
				remove: 1,
				insert: note("D4", 240),
			});
			// G4 was at tick 960, shift = 240-480 = -240 → now at tick 720
			expect(pat.notes[2]).toMatchObject({ pitch: 67, tick: 720 });
		});
	});

	describe("durationTicks", () => {
		it("adjusts for the difference between removed and inserted spans", () => {
			// Remove 1 note of 480 ticks, insert 1 note of 240 ticks → duration shrinks by 240
			const pat = splice(sequence(note("C4", "4n"), note("E4", "4n")), {
				at: 0,
				remove: 1,
				insert: note("D4", 240),
			});
			expect(pat.durationTicks).toBe(960 - 480 + 240); // 720
		});
	});

	describe("instanceof", () => {
		it("is a SplicePattern", () => {
			expect(splice(note("C4", "4n"), { at: 0 })).toBeInstanceOf(SplicePattern);
		});
	});
});

describe("insert", () => {
	describe("notes", () => {
		it("inserts notes at the specified tick", () => {
			// 2 notes. Insert D4 at tick 480
			const pat = insert(sequence(note("C4", "4n"), note("G4", "4n")), {
				at: 480,
				insert: note("D4", 120),
			});
			// D4 inserted at tick 480, G4 was at 480 and stays (it doesn't end before 480)
			const pitches = pat.notes.map((positionedNote) => positionedNote.pitch);
			expect(pitches).toContain(62); // D4 present
		});

		it("removes notes in the time window and shifts subsequent notes", () => {
			// 3 notes at 0, 480, 960. Remove 480 ticks starting at tick 480 (removes E4)
			const pat = insert(sequence(note("C4", "4n"), note("E4", "4n"), note("G4", "4n")), {
				at: 480,
				remove: 480,
			});
			// E4 at [480,960) removed. G4 at 960 shifts by -480 → tick 480
			const ticks = pat.notes.map((positionedNote) => positionedNote.tick);
			expect(ticks).not.toContain(960); // G4 shifted away from 960
		});
	});

	describe("durationTicks", () => {
		it("adjusts for inserted duration minus removed duration", () => {
			// Remove 480 ticks, insert 240 ticks → duration shrinks by 240
			const pat = insert(sequence(note("C4", "4n"), note("E4", "4n")), {
				at: 0,
				remove: 480,
				insert: note("D4", 240),
			});
			expect(pat.durationTicks).toBe(960 - 480 + 240); // 720
		});
	});

	describe("instanceof", () => {
		it("is an InsertPattern", () => {
			expect(insert(note("C4", "4n"), { at: 0 })).toBeInstanceOf(InsertPattern);
		});
	});
});
