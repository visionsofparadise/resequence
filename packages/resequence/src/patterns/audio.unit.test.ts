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

	it("stores loop points from factory", () => {
		const pattern = audio("pad", "./pad.wav", 4, { loopStartMs: 500, loopEndMs: 2000 });
		expect(pattern.properties.loopStartMs).toBe(500);
		expect(pattern.properties.loopEndMs).toBe(2000);
	});
});
