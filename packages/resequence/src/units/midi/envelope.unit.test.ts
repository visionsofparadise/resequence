import { describe, expect, it } from "vitest";
import { resolveLfo } from "../../utils/lfo";
import { gain } from "../effects/gain";
import { EnvelopeUnit, env } from "./envelope";

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
		expect(lfo.speedBeats).toBe(1);
	});

	it("applies delay and attack", () => {
		const lfo = resolveLfo({ shape: "sine", value: 0.5, frequency: 5, delay: 0.2, attack: 0.5 });
		expect(lfo.delay).toBe(0.2);
		expect(lfo.attack).toBe(0.5);
	});
});

describe("env", () => {
	it("creates an EnvelopeUnit instance", () => {
		const node = env({ attack: 0.1, decay: 0.2, sustain: 0.7, release: 0.3 });
		expect(node).toBeInstanceOf(EnvelopeUnit);
	});

	it("stores adsr and id", () => {
		const adsr = { attack: 0.05, hold: 0.1, decay: 0.3, sustain: 0.5, release: 0.4 };
		const node = env({ ...adsr, id: "vca" });
		expect(node.id).toBe("vca");
	});

	it("starts with empty targets", () => {
		const node = env({});
		expect(node.targets).toHaveLength(0);
	});

	it("to() returns void", () => {
		const node = env({});
		const gainNode = gain({ level: -3 });
		const result = node.to(gainNode);
		expect(result).toBeUndefined();
	});

	it("to() appends to node's targets", () => {
		const node = env({});
		node.to(gain({ level: -3 }));
		expect(node.targets).toHaveLength(1);
	});
});
