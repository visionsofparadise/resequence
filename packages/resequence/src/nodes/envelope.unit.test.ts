import { describe, expect, it } from "vitest";
import { resolveLfo } from "../utils/lfo";
import { gain } from "./effects/gain";
import { EnvelopeNode as EnvNode, env } from "./envelope";

describe("resolveLfo", () => {
	it("resolves Hz speed", () => {
		const lfo = resolveLfo({ shape: "sine", value: 0.3, frequency: 5 });
		expect(lfo.shape).toBe("sine");
		expect(lfo.value).toBe(0.3);
		expect(lfo.frequency).toBe(5);
		expect(lfo.delay).toBe(0);
		expect(lfo.attack).toBe(0);
	});

	it("resolves Duration speed", () => {
		const lfo = resolveLfo({ shape: "triangle", value: 12, frequency: "4n" });
		expect(lfo.frequency).toBeUndefined();
		expect(lfo.speedTicks).toBe(480);
	});

	it("applies delay and attack", () => {
		const lfo = resolveLfo({ shape: "sine", value: 0.5, frequency: 5, delay: 0.2, attack: 0.5 });
		expect(lfo.delay).toBe(0.2);
		expect(lfo.attack).toBe(0.5);
	});
});

describe("env", () => {
	it("creates an EnvNode instance", () => {
		const node = env("vca.level", { attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.3 });
		expect(node).toBeInstanceOf(EnvNode);
	});

	it("stores path and adsr", () => {
		const adsr = { attack: 0.05, hold: 0.1, decay: 0.3, sustain: 0.5, release: 0.4 };
		const node = env("vca.level", adsr);
		expect(node.path).toBe("vca.level");
		expect(node.adsr).toEqual(adsr);
	});

	it("starts with empty outputs", () => {
		const node = env("vca.level", {});
		expect(node.outputs).toHaveLength(0);
	});

	it("to() returns the downstream node", () => {
		const node = env("vca.level", {});
		const gainNode = gain({ level: -3 });
		const chained = node.to(gainNode);
		expect(chained).toBe(gainNode);
	});

	it("to() appends to node's outputs", () => {
		const node = env("vca.level", {});
		node.to(gain({ level: -3 }));
		expect(node.outputs).toHaveLength(1);
	});
});
