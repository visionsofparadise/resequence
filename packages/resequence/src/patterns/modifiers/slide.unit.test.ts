import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { gap } from "../gap";
import { layer } from "../layer";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { slide } from "./slide";

const C4 = N.C4;
const E4 = N.E4;
const G4 = N.G4;

describe("SlidePattern", () => {
	it("adds slide keyframes when notes overlap", () => {
		const pat = slide(layer(sequence(N.C4(1.5)), sequence(gap(1), N.E4(1))));

		const noteA = collectNotes(pat).find((sn) => sn.startBeat === 0 && sn.pitch.class === C4.class);
		expect(noteA).toBeDefined();
		expect(noteA!.slides).toBeDefined();
		expect(noteA!.slides).toHaveLength(2);
		expect(noteA!.slides![0]).toEqual({ beat: 1.0, pitch: C4, curve: 0 });
		expect(noteA!.slides![1]).toEqual({ beat: 1.5, pitch: E4, curve: 0 });
	});

	it("does not add slides for adjacent notes (no overlap)", () => {
		const pat = slide(sequence(N.C4(1), N.E4(1)));

		for (const sn of collectNotes(pat)) {
			expect(sn.slides).toBeUndefined();
		}
	});

	it("matches by pitch proximity for polyphonic overlaps", () => {
		const A4 = N.A4;
		const pat = slide(
			layer(sequence(N.C4(2)), sequence(N.G4(2)), sequence(gap(1), N.E4(1)), sequence(gap(1), N.A4(1))),
		);

		const noteC4 = collectNotes(pat).find((sn) => sn.startBeat === 0 && sn.pitch.class === C4.class);
		expect(noteC4!.slides).toBeDefined();
		expect(noteC4!.slides![1]).toMatchObject({ pitch: E4 });

		const noteG4 = collectNotes(pat).find((sn) => sn.startBeat === 0 && sn.pitch.class === G4.class);
		expect(noteG4!.slides).toBeDefined();
		expect(noteG4!.slides![1]).toMatchObject({ pitch: A4 });
	});

	it("merges with existing user-defined slides", () => {
		const pat = slide(
			layer(
				sequence(N.C4(2, { slides: [{ pitch: N.D4, beat: 0.5 }] })),
				sequence(gap(1), N.G4(1)),
			),
		);

		const noteA = collectNotes(pat).find((sn) => sn.startBeat === 0);
		expect(noteA!.slides).toBeDefined();
		expect(noteA!.slides!.length).toBeGreaterThanOrEqual(3);
		expect(noteA!.slides![0]).toMatchObject({ beat: 0.5 });
	});

	it("returns notes unchanged for single note", () => {
		const pat = slide(N.C4(1));
		expect(collectNotes(pat)).toHaveLength(1);
		expect(collectNotes(pat)[0]!.slides).toBeUndefined();
	});
});
