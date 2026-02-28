import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { accent } from "./accent";

describe("accent", () => {
	it("boosts velocity of notes at accented positions", () => {
		const pat = accent(
			sequence(N.C4(1, { velocity: 80 }), N.E4(1, { velocity: 80 })),
			[2],
			20,
		);
		const notes = collectNotes(pat);
		expect(notes[0]!.velocity).toBe(100);
		expect(notes[1]!.velocity).toBe(80);
	});

	it("clamps velocity to 127", () => {
		const pat = accent(sequence(N.C4(1, { velocity: 120 })), [1], 20);
		expect(collectNotes(pat)[0]!.velocity).toBe(127);
	});
});
