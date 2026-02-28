import { describe, expect, it } from "vitest";
import { N } from "../../tunings/chromatic";
import { gap } from "../gap";
import { layer } from "../layer";
import { sequence } from "../sequence";
import { collectNotes } from "../utils/tree";
import { legato } from "./legato";

describe("legato", () => {
	it("extends note duration to reach the next note", () => {
		const pat = legato(sequence(N.C4(100), gap(380), N.E4(100)));
		expect(collectNotes(pat)[0]).toMatchObject({ startBeat: 0, endBeat: 480 });
	});

	it("extends last note to fill remaining child durationBeats when extendLast is true", () => {
		const pat = legato(layer(sequence(N.C4(100)), gap(380)));
		expect(collectNotes(pat)[0]).toMatchObject({ startBeat: 0, endBeat: 380 });
	});

	it("preserves last note duration when extendLast is false", () => {
		const pat = legato(layer(sequence(N.C4(100)), gap(380)), false);
		expect(collectNotes(pat)[0]).toMatchObject({ startBeat: 0, endBeat: 100 });
	});
});
