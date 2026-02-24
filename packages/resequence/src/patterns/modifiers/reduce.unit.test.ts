import { describe, expect, it } from "vitest";
import { gap } from "../gap";
import { note } from "../note";
import { sequence } from "../sequence";
import { ReducePattern, filter, flatMap, map, mask, reduce, thin } from "./reduce";

describe("ReducePattern", () => {
	describe("notes", () => {
		it("accumulates notes using the callback", () => {
			// identity: push each note into acc
			const pat = reduce(sequence(note("C4", "4n"), note("E4", "4n")), (acc, positionedNote) => {
				acc.push(positionedNote);
				return acc;
			});
			expect(pat.notes).toHaveLength(2);
		});

		it("can filter notes via accumulator", () => {
			const pat = reduce(sequence(note("C4", "4n"), note("E4", "4n")), (acc, positionedNote) => {
				if (positionedNote.pitch === 60) acc.push(positionedNote);
				return acc;
			});
			expect(pat.notes).toHaveLength(1);
			expect(pat.notes[0]!.pitch).toBe(60);
		});

		it("receives note index and all notes", () => {
			const indices: Array<number> = [];
			let allLength = 0;
			reduce(sequence(note("C4", "4n"), note("E4", "4n")), (acc, positionedNote, noteIndex, all) => {
				indices.push(noteIndex);
				allLength = all.length;
				return acc;
			});
			expect(indices).toEqual([0, 1]);
			expect(allLength).toBe(2);
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(reduce(note("C4", "4n"), (acc) => acc).durationTicks).toBe(480);
		});
	});

	describe("instanceof", () => {
		it("is a ReducePattern", () => {
			expect(reduce(note("C4", "4n"), (acc) => acc)).toBeInstanceOf(ReducePattern);
		});
	});
});

describe("map", () => {
	it("transforms each note", () => {
		const pat = map(note("C4", "4n"), (positionedNote) => ({ ...positionedNote, pitch: positionedNote.pitch + 12 }));
		expect(pat.notes[0]!.pitch).toBe(72); // C4 + octave
	});

	it("receives index and all notes", () => {
		const received: Array<number> = [];
		map(sequence(note("C4", "4n"), note("E4", "4n")), (positionedNote, noteIndex) => {
			received.push(noteIndex);
			return positionedNote;
		});
		expect(received).toEqual([0, 1]);
	});
});

describe("filter", () => {
	it("keeps notes matching the predicate", () => {
		const pat = filter(sequence(note("C4", "4n"), note("E4", "4n")), (positionedNote) => positionedNote.pitch === 60);
		expect(pat.notes).toHaveLength(1);
		expect(pat.notes[0]!.pitch).toBe(60);
	});

	it("returns empty when no notes match", () => {
		const pat = filter(note("C4", "4n"), (positionedNote) => positionedNote.pitch > 100);
		expect(pat.notes).toHaveLength(0);
	});
});

describe("flatMap", () => {
	it("expands each note into multiple notes", () => {
		const pat = flatMap(note("C4", "4n"), (positionedNote) => [
			positionedNote,
			{ ...positionedNote, pitch: positionedNote.pitch + 12 },
		]);
		expect(pat.notes).toHaveLength(2);
		expect(pat.notes[0]!.pitch).toBe(60);
		expect(pat.notes[1]!.pitch).toBe(72);
	});

	it("can remove notes by returning empty array", () => {
		const pat = flatMap(note("C4", "4n"), () => []);
		expect(pat.notes).toHaveLength(0);
	});
});

describe("thin", () => {
	it("keeps all notes when factor is 0", () => {
		const pat = thin(sequence(note("C4", "4n"), note("E4", "4n")), 0, 1);
		expect(pat.notes).toHaveLength(2);
	});

	it("drops all notes when factor is 1", () => {
		const pat = thin(sequence(note("C4", "4n"), note("E4", "4n")), 1, 1);
		expect(pat.notes).toHaveLength(0);
	});

	it("produces deterministic results with a seed", () => {
		const input = sequence(
			note("C4", "4n"),
			note("D4", "4n"),
			note("E4", "4n"),
			note("F4", "4n"),
			note("G4", "4n"),
			note("A4", "4n"),
			note("B4", "4n"),
			note("C5", "4n"),
		);
		const pat1 = thin(input, 0.5, 99);
		const pat2 = thin(input, 0.5, 99);
		expect(pat1.notes.length).toBe(pat2.notes.length);
	});
});

describe("mask", () => {
	it("keeps notes whose tick matches a mask note tick", () => {
		// input: C4@0, E4@480; mask: note@0 in a 960-tick container → keeps C4@0 only
		// mask durationTicks=960 so E4@480 → 480%960=480, not in {0} → filtered
		const pat = mask(sequence(note("C4", "4n"), note("E4", "4n")), sequence(note("G4", "4n"), gap("4n")));
		expect(pat.notes).toHaveLength(1);
		expect(pat.notes[0]!.pitch).toBe(60); // C4 at tick 0 matches mask note at tick 0
	});

	it("cycles mask across input ticks", () => {
		// input: notes at 0, 480, 960, 1440; mask durationTicks=960 with note at 0
		// cyclicTicks: 0%960=0, 480%960=480, 960%960=0, 1440%960=480
		// mask has note at 0 only → keeps notes at ticks 0 and 960
		const pat = mask(
			sequence(note("C4", "4n"), note("D4", "4n"), note("E4", "4n"), note("F4", "4n")),
			sequence(note("G4", "4n"), note("A4", "4n")), // notes at 0 and 480, durationTicks=960
		);
		// mask has notes at 0 and 480, so all 4 input notes match
		expect(pat.notes).toHaveLength(4);
	});
});
