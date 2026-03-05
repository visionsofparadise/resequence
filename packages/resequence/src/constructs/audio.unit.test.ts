import { describe, expect, it } from "vitest";
import { audio, AudioPattern, isAudioEvent, isPreloadAudioEvent } from "./audio";

describe("audio", () => {
	it("returns an AudioPattern", () => {
		const pattern = audio("vocal", "./vocal.wav", 16);
		expect(pattern).toBeInstanceOf(AudioPattern);
	});

	it("emits preloadAudio on setup", () => {
		const pattern = audio("vocal", "./vocal.wav", 16);
		const events = pattern.setup(0);
		expect(events).toHaveLength(1);
		expect(isPreloadAudioEvent(events[0]!)).toBe(true);
		expect((events[0] as { sampleKey: string }).sampleKey).toBe("./vocal.wav");
	});

	it("emits audio event on schedule", () => {
		const pattern = audio("vocal", "./vocal.wav", 16);
		const events = pattern.schedule(0, 0, 16);
		const audioEvents = events.filter(isAudioEvent);
		expect(audioEvents).toHaveLength(1);
		expect(audioEvents[0]!.name).toBe("vocal");
		expect(audioEvents[0]!.durationBeats).toBe(16);
		expect(audioEvents[0]!.playFromBeats).toBe(0);
		expect(audioEvents[0]!.transposeSemitones).toBe(0);
		expect(audioEvents[0]!.reversed).toBe(false);
	});

	it("applies region to sampleKey", () => {
		const pattern = audio("drums", "./drums.wav", 4, { region: "kick" });
		expect(pattern.properties.sampleKey).toBe("./drums.wav#kick");
	});

	it("handles playFromBeats offset", () => {
		const pattern = audio("vocal", "./v.wav", 16, { playFromBeats: 4 });
		expect(pattern.endBeat).toBe(12);
	});

	it("passes through options", () => {
		const pattern = audio("fx", "./fx.wav", 2, {
			transpose: 7,
			reversed: true,
			unitId: "reverb",
		});
		expect(pattern.properties.transposeSemitones).toBe(7);
		expect(pattern.properties.reversed).toBe(true);
		expect(pattern.properties.unitId).toBe("reverb");
	});

	it("throws on empty path", () => {
		expect(() => audio("x", "", 1)).toThrow("empty");
	});
});

describe("AudioPattern.is", () => {
	it("returns true for AudioPattern instances", () => {
		const pattern = audio("test", "./test.wav", 4);
		expect(AudioPattern.is(pattern)).toBe(true);
	});

	it("returns false for non-AudioPattern values", () => {
		expect(AudioPattern.is({})).toBe(false);
	});
});
