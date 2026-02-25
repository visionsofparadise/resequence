import { describe, expect, it } from "vitest";
import { resolvePitch } from "../utils/pitch";
import { sampler } from "../nodes/generators/sampler";
import { gap } from "./gap";
import { layer } from "./layer";
import { metadata, MetadataPattern } from "./metadata";
import { note } from "./note";
import { repeat } from "./repeat";
import { sequence } from "./sequence";

describe("MetadataPattern", () => {
	describe("creation", () => {
		it("wraps pattern with name and description", () => {
			const m = metadata(note("C4", "4n"), { name: "My Song", description: "A test song" });
			expect(m.type).toBe("metadata");
			expect(m.name).toBe("My Song");
			expect(m.description).toBe("A test song");
		});

		it("supports partial metadata", () => {
			const m = metadata(note("C4", "4n"), { name: "Test" });
			expect(m.name).toBe("Test");
			expect(m.description).toBeUndefined();
		});

		it("supports empty config", () => {
			const m = metadata(note("C4", "4n"), {});
			expect(m.name).toBeUndefined();
			expect(m.description).toBeUndefined();
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
});
