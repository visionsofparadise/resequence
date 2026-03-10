import { sequence } from "@resequence/patterns";
import { describe, expect, it } from "vitest";
import { Playback, play } from "./playback";
import { PatternSource } from "./sources/pattern";

function createSource(): PatternSource {
	return new PatternSource(sequence());
}

describe("play factory", () => {
	it("returns a Playback instance", () => {
		const source = createSource();
		const playback = play(source, {} as AudioContext);
		expect(playback).toBeInstanceOf(Playback);
	});
});

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
