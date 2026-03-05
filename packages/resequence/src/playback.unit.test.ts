import { describe, expect, it } from "vitest";
import { Playback } from "./playback";
import { play } from "./playback";
import { Router } from "./router";

describe("play factory", () => {
	it("returns a Playback instance", () => {
		const router = new Router();
		const playback = play(router, {} as AudioContext);
		expect(playback).toBeInstanceOf(Playback);
	});
});

describe("Playback", () => {
	it("starts in stopped state", () => {
		const router = new Router();
		const playback = new Playback(router, {} as AudioContext);
		expect(playback.state).toBe("stopped");
	});

	it("beat returns 0 when stopped", () => {
		const router = new Router();
		const playback = new Playback(router, {} as AudioContext);
		expect(playback.beat).toBe(0);
	});

	it("stop from stopped is a no-op", () => {
		const router = new Router();
		const states: string[] = [];
		const playback = new Playback(router, {} as AudioContext);
		playback.on("statechange", (state) => states.push(state));
		playback.stop();
		expect(states).toEqual([]);
	});

	it("registers and removes event listeners", () => {
		const router = new Router();
		const playback = new Playback(router, {} as AudioContext);
		const calls: string[] = [];
		const listener = (state: string) => calls.push(state);
		playback.on("statechange", listener);
		playback.off("statechange", listener);
		expect(calls).toEqual([]);
	});
});
