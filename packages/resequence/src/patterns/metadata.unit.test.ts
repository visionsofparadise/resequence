import { describe, expect, it } from "vitest";
import { sampler } from "../units/generators/sampler";
import { resolvePitch } from "../utils/pitch";
import { gap } from "./gap";
import { layer } from "./layer";
import { metadata } from "./metadata";
import { note } from "./note";
import { repeat } from "./repeat";
import { sequence } from "./sequence";

describe("MetadataPattern", () => {
	describe("creation", () => {
		it("wraps pattern with name and description", () => {
			const m = metadata(note("C4", "4n"), { name: "My Song", description: "A test song" });
			expect(m.type).toBe("metadata");
			expect(m.meta.name).toBe("My Song");
			expect(m.meta.description).toBe("A test song");
		});

		it("supports partial metadata", () => {
			const m = metadata(note("C4", "4n"), { name: "Test" });
			expect(m.meta.name).toBe("Test");
			expect(m.meta.description).toBeUndefined();
		});

		it("supports empty config", () => {
			const m = metadata(note("C4", "4n"), {});
			expect(m.meta.name).toBeUndefined();
			expect(m.meta.description).toBeUndefined();
		});

		it("supports all metadata fields", () => {
			const config = {
				classes: ["C"],
				octaveRatio: 2 as const,
				reference: { class: "C", octave: 4, hz: 264 },
			};
			const m = metadata(note("C4", "4n"), {
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
			const m = metadata(note("C4", "4n"), {});
			expect(m.durationBeats).toBe(1);
		});

		it("delegates sequence duration", () => {
			const m = metadata(sequence(note("C4", "4n"), note("E4", "4n")), {});
			expect(m.durationBeats).toBe(2);
		});
	});

	describe("notes", () => {
		it("delegates to child", () => {
			const pat = metadata(note("C4", "4n"), {});
			expect(pat.notes).toMatchObject([{ beat: 0, pitch: resolvePitch("C4") }]);
		});

		it("handles nested structures", () => {
			const inst = sampler("drums", "./kick.wav", { root: "C1" });
			const kick = repeat(note("C1", "4n"), 4).route(inst);
			const snare = sequence(gap("4n"), note("D1", "4n"), gap("4n"), note("D1", "4n"));
			const groove = layer(kick, snare);
			const song = metadata(groove, { name: "Groove" });

			expect(song.notes).toMatchObject([
				{ beat: 0, pitch: resolvePitch("C1") },
				{ beat: 1, pitch: resolvePitch("C1") },
				{ beat: 2, pitch: resolvePitch("C1") },
				{ beat: 3, pitch: resolvePitch("C1") },
				{ beat: 1, pitch: resolvePitch("D1") },
				{ beat: 3, pitch: resolvePitch("D1") },
			]);
		});
	});

	describe("metadatas aggregation", () => {
		it("includes own metadata at beat 0", () => {
			const m = metadata(note("C4", "4n"), { name: "test" });
			expect(m.metadatas).toEqual([{ beat: 0, meta: { name: "test" } }]);
		});

		it("accumulates child metadatas through sequence", () => {
			const m = metadata(sequence(metadata(note("C4", "4n"), { marker: "intro" }), metadata(note("E4", "4n"), { marker: "verse" })), { name: "song" });
			expect(m.metadatas).toEqual([
				{ beat: 0, meta: { name: "song" } },
				{ beat: 0, meta: { marker: "intro" } },
				{ beat: 1, meta: { marker: "verse" } },
			]);
		});

		it("leaf patterns return empty metadatas", () => {
			expect(note("C4", "4n").metadatas).toEqual([]);
			expect(gap("4n").metadatas).toEqual([]);
		});
	});
});
