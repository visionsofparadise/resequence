import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import { audio, AudioPattern } from "./audio";

describe("AudioPattern", () => {
	describe("validation", () => {
		it("rejects empty path", () => {
			expect(() => audio("break", "", "4n")).toThrow(ResequenceError);
			expect(() => audio("break", "", "4n")).toThrow("path must not be empty");
		});
	});

	describe("creation", () => {
		it("creates with name and path", () => {
			const pattern = audio("break", "./break.wav", "4n");
			expect(pattern.type).toBe("audio");
			expect(pattern.name).toBe("break");
			expect(pattern.path).toBe("./break.wav");
			expect(pattern.transposeSemitones).toBe(0);
			expect(pattern.reversed).toBe(false);
		});

		it("has 0 duration when numeric 0", () => {
			expect(audio("break", "./break.wav", 0).durationBeats).toBe(0);
		});

		it("resolves explicit duration", () => {
			expect(audio("break", "./break.wav", "4n").durationBeats).toBe(1);
		});
	});

	describe("loop points", () => {
		it("stores loop points from factory", () => {
			const pattern = audio("pad", "./pad.wav", "1n", { loopStartMs: 500, loopEndMs: 2000 });
			expect(pattern.loopStartMs).toBe(500);
			expect(pattern.loopEndMs).toBe(2000);
		});

		it("has no loop points by default", () => {
			const pattern = audio("pad", "./pad.wav", "4n");
			expect(pattern.loopStartMs).toBeUndefined();
			expect(pattern.loopEndMs).toBeUndefined();
		});
	});

	describe("notes", () => {
		it("returns empty", () => {
			expect(audio("kick", "./kick.wav", "4n").notes).toEqual([]);
		});
	});

	describe("instanceof", () => {
		it("is an AudioPattern", () => {
			expect(audio("break", "./break.wav", "4n")).toBeInstanceOf(AudioPattern);
		});
	});
});
