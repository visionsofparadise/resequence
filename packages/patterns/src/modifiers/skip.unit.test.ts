import { describe, expect, it } from "vitest";
import { sequence } from "../patterns/sequence";
import { N } from "../tunings/chromatic";
import { skip } from "./skip";

describe("skip", () => {
	it("produces zero duration", () => {
		const tree = sequence(N.C4(4));
		const result = skip(tree);
		expect(result.startBeat).toBe(0);
		expect(result.endBeat).toBe(0);
	});
});
