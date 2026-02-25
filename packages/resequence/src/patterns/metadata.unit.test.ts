import { describe, expect, it } from "vitest";
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

	describe("durationTicks", () => {
		it("delegates to child", () => {
			const m = metadata(note("C4", "4n"), {});
			expect(m.durationTicks).toBe(480);
		});

		it("delegates sequence duration", () => {
			const m = metadata(sequence(note("C4", "4n"), note("E4", "4n")), {});
			expect(m.durationTicks).toBe(960);
		});
	});

	describe("notes", () => {
		it("delegates to child", () => {
			const pat = metadata(note("C4", "4n"), {});
			expect(pat.notes).toMatchObject([{ tick: 0, pitch: 60 }]);
		});

		it("handles nested structures", () => {
			const inst = sampler("drums", "./kick.wav", { root: "C1" });
			const kick = repeat(note("C1", "4n"), 4).route(inst);
			const snare = sequence(gap("4n"), note("D1", "4n"), gap("4n"), note("D1", "4n"));
			const groove = layer(kick, snare);
			const song = metadata(groove, { name: "Groove" });

			expect(song.notes).toMatchObject([
				{ tick: 0, pitch: 24 },
				{ tick: 480, pitch: 24 },
				{ tick: 960, pitch: 24 },
				{ tick: 1440, pitch: 24 },
				{ tick: 480, pitch: 26 },
				{ tick: 1440, pitch: 26 },
			]);
		});
	});
});
