import { describe, expect, it } from "vitest";
import { audio } from "../patterns/audio";
import { layer } from "../patterns/layer";
import { marker, region, timeSignature } from "../patterns/metadata";
import { sequence } from "../patterns/sequence";
import { normalizeBpm, tempo } from "../patterns/tempo";
import { N } from "../tunings/chromatic";
import { sampler } from "../units/generators/sampler";
import { collectMetadata } from "./pattern-metadata";

describe("collectMetadata", () => {
	it("returns empty metadata for flat pattern with no wrappers", () => {
		const pattern = sequence(N.C4(1));
		const metadata = collectMetadata(pattern);

		expect(metadata.tempoMap).toEqual([]);
		expect(metadata.markers).toEqual([]);
		expect(metadata.timeSignatures).toEqual([]);
		expect(metadata.regions).toEqual([]);
		expect(metadata.tracks.size).toBe(0);
	});

	describe("tempo", () => {
		it("collects single tempo", () => {
			const pattern = tempo(sequence(N.C4(4)), 140);
			const metadata = collectMetadata(pattern);

			expect(metadata.tempoMap).toEqual([{ beat: 0, bpm: 140 }]);
		});

		it("collects nested tempo at correct offset", () => {
			const pattern = sequence(N.C4(1), tempo(sequence(N.E4(1)), 100));
			const metadata = collectMetadata(pattern);

			expect(metadata.tempoMap).toEqual([{ beat: 1, bpm: 100 }]);
		});

		it("collects step keyframes", () => {
			const pattern = tempo(sequence(N.C4(4)), 120, {
				keyframes: [{ beat: 2, value: normalizeBpm(140) }],
			});
			const metadata = collectMetadata(pattern);

			expect(metadata.tempoMap).toEqual([
				{ beat: 0, bpm: 120 },
				{ beat: 2, bpm: 140 },
			]);
		});

		it("collects linear ramp keyframes", () => {
			const pattern = tempo(sequence(N.C4(4)), 120, {
				keyframes: [{ beat: 1, value: normalizeBpm(140) }],
			});
			const metadata = collectMetadata(pattern);

			expect(metadata.tempoMap).toEqual([
				{ beat: 0, bpm: 120 },
				{ beat: 1, bpm: 140 },
			]);
		});

		it("samples curved ramp keyframes", () => {
			const pattern = tempo(sequence(N.C4(4)), 120, {
				keyframes: [{ beat: 1, value: normalizeBpm(240), curve: 1 }],
			});
			const metadata = collectMetadata(pattern);

			expect(metadata.tempoMap.length).toBeGreaterThan(2);
			const mid = metadata.tempoMap[Math.floor(metadata.tempoMap.length / 2)];
			expect(mid?.bpm).toBeGreaterThan(120);
			expect(mid?.bpm).toBeLessThan(240);
		});

		it("override beats outer tempo", () => {
			const pattern = tempo(
				tempo(sequence(N.C4(4)), 140, { override: true }),
				120,
			);
			const metadata = collectMetadata(pattern);

			expect(metadata.tempoMap).toContainEqual({ beat: 0, bpm: 140 });
		});

		it("outer tempo suppresses inner non-override", () => {
			const pattern = tempo(
				sequence(N.C4(4), tempo(sequence(N.E4(4)), 140)),
				120,
			);
			const metadata = collectMetadata(pattern);

			expect(metadata.tempoMap).toEqual([{ beat: 0, bpm: 120 }]);
		});
	});

	describe("markers", () => {
		it("collects markers at correct offsets", () => {
			const pattern = sequence(
				marker(sequence(N.C4(1)), "intro"),
				N.E4(1),
				marker(sequence(N.G4(1)), "verse"),
			);
			const metadata = collectMetadata(pattern);

			expect(metadata.markers).toEqual([
				{ beat: 0, name: "intro" },
				{ beat: 2, name: "verse" },
			]);
		});

		it("sorts markers by beat", () => {
			const pattern = layer(
				sequence(N.C4(1), marker(sequence(N.E4(1)), "b")),
				marker(sequence(N.C4(1)), "a"),
			);
			const metadata = collectMetadata(pattern);

			expect(metadata.markers[0]?.name).toBe("a");
			expect(metadata.markers[1]?.name).toBe("b");
		});
	});

	describe("time signatures", () => {
		it("collects time signatures at correct offsets", () => {
			const pattern = timeSignature(
				sequence(
					N.C4(4),
					timeSignature(sequence(N.E4(4)), [3, 4]),
				),
				[4, 4],
			);
			const metadata = collectMetadata(pattern);

			expect(metadata.timeSignatures).toEqual([
				{ beat: 0, timeSignature: [4, 4] },
				{ beat: 4, timeSignature: [3, 4] },
			]);
		});
	});

	describe("regions", () => {
		it("collects region with correct start and end beats", () => {
			const pattern = region(sequence(N.C4(4)), "intro");
			const metadata = collectMetadata(pattern);

			expect(metadata.regions).toEqual([
				{ name: "intro", startBeat: 0, endBeat: 4 },
			]);
		});

		it("collects region at offset in sequence", () => {
			const pattern = sequence(
				N.C4(4),
				region(sequence(N.E4(2)), "verse"),
			);
			const metadata = collectMetadata(pattern);

			expect(metadata.regions).toEqual([
				{ name: "verse", startBeat: 4, endBeat: 6 },
			]);
		});

		it("collects multiple regions sorted by start beat", () => {
			const pattern = sequence(
				region(sequence(N.C4(4)), "intro"),
				region(sequence(N.E4(4)), "verse"),
			);
			const metadata = collectMetadata(pattern);

			expect(metadata.regions).toEqual([
				{ name: "intro", startBeat: 0, endBeat: 4 },
				{ name: "verse", startBeat: 4, endBeat: 8 },
			]);
		});
	});

	describe("tracks", () => {
		it("collects AudioPattern names", () => {
			const pattern = sequence(
				audio("drums", "./drums.wav", 4),
				audio("bass", "./bass.wav", 4),
			);
			const metadata = collectMetadata(pattern);

			expect(metadata.tracks).toEqual(new Set(["drums", "bass"]));
		});

		it("collects MidiPattern output IDs", () => {
			const pattern = sequence(N.C4(4)).route(sampler("./piano.wav", { id: "piano" }));
			const metadata = collectMetadata(pattern);

			expect(metadata.tracks.has("piano")).toBe(true);
		});

		it("excludes outputs without IDs", () => {
			const pattern = sequence(N.C4(4)).route(sampler("./piano.wav"));
			const metadata = collectMetadata(pattern);

			expect(metadata.tracks.size).toBe(0);
		});

		it("deduplicates track names", () => {
			const pattern = sequence(
				audio("drums", "./drums.wav", 4),
				audio("drums", "./drums2.wav", 4),
			);
			const metadata = collectMetadata(pattern);

			expect(metadata.tracks.size).toBe(1);
		});
	});

	describe("combined", () => {
		it("collects all metadata types in a single walk", () => {
			const pattern = tempo(
				timeSignature(
					sequence(
						marker(region(sequence(N.C4(4)), "intro"), "start"),
						marker(
							region(
								sequence(audio("drums", "./drums.wav", 4)),
								"verse",
							),
							"verse-start",
						),
					),
					[4, 4],
				),
				120,
			);

			const metadata = collectMetadata(pattern);

			expect(metadata.tempoMap).toEqual([{ beat: 0, bpm: 120 }]);
			expect(metadata.markers).toEqual([
				{ beat: 0, name: "start" },
				{ beat: 4, name: "verse-start" },
			]);
			expect(metadata.timeSignatures).toEqual([{ beat: 0, timeSignature: [4, 4] }]);
			expect(metadata.regions).toEqual([
				{ name: "intro", startBeat: 0, endBeat: 4 },
				{ name: "verse", startBeat: 4, endBeat: 8 },
			]);
			expect(metadata.tracks).toEqual(new Set(["drums"]));
		});
	});
});
