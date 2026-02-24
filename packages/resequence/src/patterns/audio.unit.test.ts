import { describe, expect, it } from "vitest";
import { ResequenceError } from "../error";
import { audio, AudioPattern } from "./audio";

describe("AudioPattern", () => {
	describe("validation", () => {
		it("rejects empty path", () => {
			expect(() => audio("break", "")).toThrow(ResequenceError);
			expect(() => audio("break", "")).toThrow("path must not be empty");
		});
	});

	describe("creation", () => {
		it("creates with name and path", () => {
			const pattern = audio("break", "./break.wav");
			expect(pattern.type).toBe("audio");
			expect(pattern.name).toBe("break");
			expect(pattern.path).toBe("./break.wav");
			expect(pattern.transposeSemitones).toBe(0);
			expect(pattern.reversed).toBe(false);
		});

		it("has 0 duration when no explicit duration", () => {
			expect(audio("break", "./break.wav").durationTicks).toBe(0);
		});

		it("resolves explicit duration", () => {
			expect(audio("break", "./break.wav", "4n").durationTicks).toBe(480);
		});
	});

	describe("transpose", () => {
		it("accumulates semitone offset", () => {
			expect(audio("break", "./break.wav").transpose(3).transposeSemitones).toBe(3);
		});

		it("accumulates across multiple transposes", () => {
			expect(audio("break", "./break.wav").transpose(3).transpose(4).transposeSemitones).toBe(7);
		});

		it("supports negative intervals", () => {
			expect(audio("break", "./break.wav").transpose(-5).transposeSemitones).toBe(-5);
		});
	});

	describe("reverse", () => {
		it("toggles reversed flag", () => {
			expect(audio("break", "./break.wav").reverse().reversed).toBe(true);
		});

		it("double reverse cancels", () => {
			expect(audio("break", "./break.wav").reverse().reverse().reversed).toBe(false);
		});
	});

	describe("loop points", () => {
		it("stores loop points from factory", () => {
			const pattern = audio("pad", "./pad.wav", "1n", { loopStartMs: 500, loopEndMs: 2000 });
			expect(pattern.loopStartMs).toBe(500);
			expect(pattern.loopEndMs).toBe(2000);
		});

		it("has no loop points by default", () => {
			const pattern = audio("pad", "./pad.wav");
			expect(pattern.loopStartMs).toBeUndefined();
			expect(pattern.loopEndMs).toBeUndefined();
		});

		it("survives transpose", () => {
			const pattern = audio("pad", "./pad.wav", "1n", { loopStartMs: 500, loopEndMs: 2000 }).transpose(3);
			expect(pattern.loopStartMs).toBe(500);
			expect(pattern.loopEndMs).toBe(2000);
		});

		it("survives reverse", () => {
			const pattern = audio("pad", "./pad.wav", "1n", { loopStartMs: 500, loopEndMs: 2000 }).reverse();
			expect(pattern.loopStartMs).toBe(500);
			expect(pattern.loopEndMs).toBe(2000);
		});
	});

	describe("getMidi", () => {
		it("returns empty", () => {
			expect(audio("kick", "./kick.wav").getMidi()).toEqual([]);
		});
	});

	describe("instanceof", () => {
		it("is an AudioPattern", () => {
			expect(audio("break", "./break.wav")).toBeInstanceOf(AudioPattern);
		});
	});
});
