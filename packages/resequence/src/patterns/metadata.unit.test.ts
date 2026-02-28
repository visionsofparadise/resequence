import { describe, expect, it } from "vitest";
import { collectMarkers } from "../rendering/collect-markers";
import { sampler } from "../units/generators/sampler";
import { resolveDuration } from "../utils/duration";
import { resolvePitch } from "../utils/pitch";
import { gap } from "./gap";
import { layer } from "./layer";
import { metadata } from "./metadata";
import { note } from "./note";
import { repeat } from "./modifiers/repeat";
import { sequence } from "./sequence";
import { collectNotes } from "./utils/tree";

describe("MetadataPattern", () => {
	describe("creation", () => {
		it("wraps pattern with name and description", () => {
			const m = metadata(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), { name: "My Song", description: "A test song" });
			expect(m).toBeInstanceOf(m.constructor);
			expect(m.meta.name).toBe("My Song");
			expect(m.meta.description).toBe("A test song");
		});

		it("supports partial metadata", () => {
			const m = metadata(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), { name: "Test" });
			expect(m.meta.name).toBe("Test");
			expect(m.meta.description).toBeUndefined();
		});

		it("supports empty config", () => {
			const m = metadata(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), {});
			expect(m.meta.name).toBeUndefined();
			expect(m.meta.description).toBeUndefined();
		});

		it("supports all metadata fields", () => {
			const config = {
				classes: ["C"],
				octaveRatio: 2 as const,
				reference: { class: "C", octave: 4, hz: 264 },
			};
			const m = metadata(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), {
				name: "Song",
				description: "desc",
				timeSignature: [4, 4] as const,
				tuning: config,
				marker: "intro",
				region: "verse",
			});
			expect(m.meta.timeSignature).toEqual([4, 4]);
			expect(m.meta.tuning).toEqual(config);
			expect(m.meta.marker).toBe("intro");
			expect(m.meta.region).toBe("verse");
		});
	});

	describe("durationBeats", () => {
		it("delegates to child", () => {
			const m = metadata(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), {});
			expect(m.endBeat - m.startBeat).toBe(1);
		});

		it("delegates sequence duration", () => {
			const m = metadata(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n"))), {});
			expect(m.endBeat - m.startBeat).toBe(2);
		});
	});

	describe("notes", () => {
		it("delegates to child", () => {
			const pat = metadata(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), {});
			const notes = collectNotes(pat);
			expect(notes).toMatchObject([{ startBeat: 0, pitch: resolvePitch("C4") }]);
		});

		it("handles nested structures", () => {
			const inst = sampler("./kick.wav", { root: "C1", id: "drums" });
			const kick = repeat(sequence(note(resolvePitch("C1"), resolveDuration("4n"))), 4).route(inst);
			const snare = sequence(gap("4n"), note(resolvePitch("D1"), resolveDuration("4n")), gap("4n"), note(resolvePitch("D1"), resolveDuration("4n")));
			const groove = layer(kick, snare);
			const song = metadata(groove, { name: "Groove" });

			const notes = collectNotes(song);
			expect(notes).toMatchObject([
				{ startBeat: 0, pitch: resolvePitch("C1") },
				{ startBeat: 1, pitch: resolvePitch("C1") },
				{ startBeat: 2, pitch: resolvePitch("C1") },
				{ startBeat: 3, pitch: resolvePitch("C1") },
				{ startBeat: 1, pitch: resolvePitch("D1") },
				{ startBeat: 3, pitch: resolvePitch("D1") },
			]);
		});
	});

	describe("markers aggregation", () => {
		it("includes own marker at beat 0", () => {
			const m = metadata(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), { marker: "test" });
			expect(collectMarkers(m)).toEqual([{ beat: 0, name: "test" }]);
		});

		it("accumulates child markers through sequence", () => {
			const m = metadata(sequence(
				metadata(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), { marker: "intro" }),
				metadata(sequence(note(resolvePitch("E4"), resolveDuration("4n"))), { marker: "verse" }),
			), { name: "song" });
			const markers = collectMarkers(m);
			expect(markers).toEqual([
				{ beat: 0, name: "intro" },
				{ beat: 1, name: "verse" },
			]);
		});

		it("leaf patterns return empty markers", () => {
			expect(collectMarkers(sequence(note(resolvePitch("C4"), resolveDuration("4n"))))).toEqual([]);
			expect(collectMarkers(gap("4n"))).toEqual([]);
		});
	});
});
