import { sequence } from "@resequence/patterns-core";
import { describe, expect, it } from "vitest";
import { Playback } from "./playback";
import { Router } from "./router";

function createSource(): Router {
	return new Router(sequence(), {});
}

describe("Playback", () => {
	it("starts in stopped state", () => {
		const source = createSource();
		const playback = new Playback(source, {} as AudioContext);
		expect(playback.state).toBe("stopped");
	});

	it("beat returns 0 when stopped", () => {
		const source = createSource();
		const playback = new Playback(source, {} as AudioContext);
		expect(playback.beat).toBe(0);
	});

	it("stop from stopped is a no-op", () => {
		const source = createSource();
		const states: string[] = [];
		const playback = new Playback(source, {} as AudioContext);
		playback.on("statechange", (state) => states.push(state));
		playback.stop();
		expect(states).toEqual([]);
	});

	it("registers and removes event listeners", () => {
		const source = createSource();
		const playback = new Playback(source, {} as AudioContext);
		const calls: string[] = [];
		const listener = (state: string) => calls.push(state);
		playback.on("statechange", listener);
		playback.off("statechange", listener);
		expect(calls).toEqual([]);
	});
});
