import { describe, expect, it } from "vitest";
import { note } from "../note";
import { EchoPattern, echo } from "./echo";

describe("EchoPattern", () => {
	describe("notes", () => {
		it("adds the specified number of echo copies", () => {
			const pat = echo(note("C4", "4n"), 480, 2, 0.5);
			expect(pat.notes).toHaveLength(3); // original + 2 echoes
		});

		it("spaces echoes by interval", () => {
			const pat = echo(note("C4", "4n"), 480, 2, 0.5);
			expect(pat.notes[0]).toMatchObject({ tick: 0 });
			expect(pat.notes[1]).toMatchObject({ tick: 480 });
			expect(pat.notes[2]).toMatchObject({ tick: 960 });
		});

		it("applies decay to echo velocity", () => {
			const pat = echo(note("C4", "4n", { velocity: 100 }), 480, 2, 0.5);
			expect(pat.notes[0]!.velocity).toBe(100);
			expect(pat.notes[1]!.velocity).toBe(50); // 100 * 0.5^1
			expect(pat.notes[2]!.velocity).toBe(25); // 100 * 0.5^2
		});

		it("clamps echo velocity to minimum 1", () => {
			// 1 * 0.1^1 = 0.1, rounds to 0, clamped to 1
			const pat = echo(note("C4", "4n", { velocity: 1 }), 480, 1, 0.1);
			expect(pat.notes[1]!.velocity).toBe(1);
		});

		it("preserves pitch on all copies", () => {
			const pat = echo(note("G4", "4n"), 480, 2, 0.5);
			for (const positionedNote of pat.notes) {
				expect(positionedNote.pitch).toBe(67);
			}
		});
	});

	describe("durationTicks", () => {
		it("preserves child duration", () => {
			expect(echo(note("C4", "4n"), 480, 2, 0.5).durationTicks).toBe(480);
		});
	});

	describe("instanceof", () => {
		it("is an EchoPattern", () => {
			expect(echo(note("C4", "4n"), 480, 2, 0.5)).toBeInstanceOf(EchoPattern);
		});
	});
});
