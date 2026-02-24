import { describe, expect, it } from "vitest";
import { sampler } from "./nodes/generators/sampler";
import { automate } from "./patterns/automate";
import { audio } from "./patterns/audio";
import { layer } from "./patterns/layer";
import { metadata } from "./patterns/metadata";
import { note } from "./patterns/note";
import { repeat } from "./patterns/repeat";
import { sequence } from "./patterns/sequence";
import { validate } from "./validate";

describe("validate", () => {
	describe("ORPHANED_NOTES", () => {
		it("warns when note is not inside a route", () => {
			const warnings = validate(note("C4", "4n"));
			expect(warnings).toContainEqual(expect.objectContaining({ code: "ORPHANED_NOTES" }));
		});

		it("warns for notes inside sequence without route", () => {
			const warnings = validate(sequence(note("C4", "4n"), note("E4", "4n")));
			expect(warnings.filter((w) => w.code === "ORPHANED_NOTES")).toHaveLength(2);
		});

		it("does not warn when note is routed to sampler", () => {
			const bass = sampler("bass", "./bass.wav", { root: "C2" });
			const warnings = validate(note("C4", "4n").route(bass));
			expect(warnings.filter((w) => w.code === "ORPHANED_NOTES")).toHaveLength(0);
		});

		it("does not warn for notes nested deep inside route", () => {
			const bass = sampler("bass", "./bass.wav", { root: "C2" });
			const warnings = validate(sequence(note("C4", "4n"), note("E4", "4n")).route(bass));
			expect(warnings.filter((w) => w.code === "ORPHANED_NOTES")).toHaveLength(0);
		});
	});

	describe("EMPTY_CONTAINER", () => {
		it("warns for empty sequence", () => {
			const warnings = validate(sequence());
			expect(warnings).toContainEqual(expect.objectContaining({ code: "EMPTY_CONTAINER" }));
		});

		it("warns for empty layer", () => {
			const warnings = validate(layer());
			expect(warnings).toContainEqual(expect.objectContaining({ code: "EMPTY_CONTAINER" }));
		});

		it("does not warn for non-empty sequence", () => {
			const bass = sampler("bass", "./bass.wav", { root: "C2" });
			const warnings = validate(sequence(note("C4", "4n")).route(bass));
			expect(warnings.filter((w) => w.code === "EMPTY_CONTAINER")).toHaveLength(0);
		});
	});

	describe("combined", () => {
		it("returns multiple warnings from a complex tree", () => {
			const auto = automate("sweep", "synth.hp.frequency", [{ time: 0, value: 80 }]);
			const warnings = validate(layer(sequence(), note("C4", "4n"), auto));
			const codes = warnings.map((w) => w.code);
			expect(codes).toContain("EMPTY_CONTAINER");
			expect(codes).toContain("ORPHANED_NOTES");
		});
	});

	describe("traversal", () => {
		it("traverses through metadata", () => {
			const warnings = validate(metadata(note("C4", "4n"), { tempo: 120 }));
			expect(warnings).toContainEqual(expect.objectContaining({ code: "ORPHANED_NOTES" }));
		});

		it("traverses through repeat", () => {
			const warnings = validate(repeat(note("C4", "4n"), 4));
			expect(warnings.filter((w) => w.code === "ORPHANED_NOTES")).toHaveLength(1);
		});

		it("ignores audio patterns for orphaned notes", () => {
			const warnings = validate(audio("break", "./break.wav"));
			expect(warnings.filter((w) => w.code === "ORPHANED_NOTES")).toHaveLength(0);
		});
	});
});
