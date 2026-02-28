import { describe, expect, it } from "vitest";
import { resolveDuration } from "../../utils/duration";
import { resolvePitch } from "../../utils/pitch";
import { gap } from "../gap";
import { layer } from "../layer";
import { note } from "../note";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { LegatoPattern, legato } from "./legato";

describe("LegatoPattern", () => {
	describe("notes", () => {
		it("extends note duration to reach the next note", () => {
			// C4@0 dur 100, gap 380, E4@480 dur 100 — C4 should extend to fill gap
			const pat = legato(sequence(note(resolvePitch("C4"), 100), gap(380), note(resolvePitch("E4"), 100)));
			expect(collectNotes(pat)[0]).toMatchObject({ startBeat: 0, endBeat: 480 });
		});

		it("extends last note to fill remaining child durationBeats when extendLast is true", () => {
			// Single note with shorter duration than pattern space
			const pat = legato(layer(sequence(note(resolvePitch("C4"), 100)), gap(380)));
			expect(collectNotes(pat)[0]).toMatchObject({ startBeat: 0, endBeat: 380 });
		});

		it("preserves last note duration when extendLast is false", () => {
			const pat = legato(layer(sequence(note(resolvePitch("C4"), 100)), gap(380)), false);
			expect(collectNotes(pat)[0]).toMatchObject({ startBeat: 0, endBeat: 100 });
		});

		it("preserves pitch", () => {
			const pat = legato(sequence(note(resolvePitch("C4"), 100), gap(380), note(resolvePitch("E4"), 100)));
			expect(collectNotes(pat)[0]!.pitch).toEqual(resolvePitch("C4"));
			expect(collectNotes(pat)[1]!.pitch).toEqual(resolvePitch("E4"));
		});
	});

	describe("durationBeats", () => {
		it("preserves child duration", () => {
			expect(legato(sequence(note(resolvePitch("C4"), resolveDuration("4n")))).endBeat - legato(sequence(note(resolvePitch("C4"), resolveDuration("4n")))).startBeat).toBe(1);
		});
	});

	describe("instanceof", () => {
		it("is a LegatoPattern", () => {
			expect(legato(sequence(note(resolvePitch("C4"), resolveDuration("4n"))))).toBeInstanceOf(LegatoPattern);
		});
	});
});
