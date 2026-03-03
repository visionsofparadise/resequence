import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import { audio, AudioPattern } from "./audio";

describe("AudioPattern", () => {
	it("rejects empty path", () => {
		expect(() => audio("break", "", 1)).toThrow(ResequenceError);
		expect(() => audio("break", "", 1)).toThrow("path must not be empty");
	});

	it("creates with name, path, and duration", () => {
		const pattern = audio("break", "./break.wav", 1);
		expect(pattern).toBeInstanceOf(AudioPattern);
		expect(pattern.properties.name).toBe("break");
		expect(pattern.properties.path).toBe("./break.wav");
		expect(pattern.endBeat - pattern.startBeat).toBe(1);
	});

	it("has 0 duration when numeric 0", () => {
		const pattern = audio("break", "./break.wav", 0);
		expect(pattern.endBeat - pattern.startBeat).toBe(0);
	});

	it("defaults playFromBeats to 0 with full extent", () => {
		const pattern = audio("break", "./break.wav", 4);
		expect(pattern.properties.playFromBeats).toBe(0);
		expect(pattern.properties.durationBeats).toBe(4);
		expect(pattern.endBeat - pattern.startBeat).toBe(4);
	});

	it("trims pattern extent by playFromBeats", () => {
		const pattern = audio("break", "./break.wav", 4, { playFromBeats: 1 });
		expect(pattern.properties.playFromBeats).toBe(1);
		expect(pattern.properties.durationBeats).toBe(4);
		expect(pattern.endBeat - pattern.startBeat).toBe(3);
	});
});
