import { describe, expect, it } from "vitest";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { mute } from "./mute";

describe("mute", () => {
	it("preserves duration with no output", () => {
		const tree = sequence(N.C4(4));
		const result = mute(tree);
		expect(result.startBeat).toBe(0);
		expect(result.endBeat).toBe(4);
		const events = result.schedule(0, -Infinity, Infinity);
		expect(events).toHaveLength(0);
	});
});
