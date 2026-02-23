import { describe, expect, it } from "vitest";
import { instrument, kit } from "./instrument/instrument";
import { effects, reverb } from "./instrument/effect";
import { automate } from "./patterns/automate";
import { layer } from "./patterns/layer";
import { metadata } from "./patterns/metadata";
import { note } from "./patterns/note";
import { repeat } from "./patterns/repeat";
import { sample } from "./patterns/sample";
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

		it("does not warn when note is inside routeTo", () => {
			const bass = instrument("bass", "./bass.wav", { root: "C2" });
			const warnings = validate(note("C4", "4n").routeTo(bass));
			expect(warnings.filter((w) => w.code === "ORPHANED_NOTES")).toHaveLength(0);
		});

		it("does not warn for notes nested deep inside route", () => {
			const bass = instrument("bass", "./bass.wav", { root: "C2" });
			const warnings = validate(sequence(note("C4", "4n"), note("E4", "4n")).routeTo(bass));
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
			const bass = instrument("bass", "./bass.wav", { root: "C2" });
			const warnings = validate(sequence(note("C4", "4n")).routeTo(bass));
			expect(warnings.filter((w) => w.code === "EMPTY_CONTAINER")).toHaveLength(0);
		});
	});

	describe("ORPHANED_AUTOMATION", () => {
		it("warns when automation targets unrouted instrument", () => {
			const auto = automate("sweep", "bass.hp.frequency", [{ time: 0, value: 80 }]);
			const warnings = validate(auto);
			expect(warnings).toContainEqual(expect.objectContaining({ code: "ORPHANED_AUTOMATION" }));
			expect(warnings.find((w) => w.code === "ORPHANED_AUTOMATION")!.message).toContain("bass");
		});

		it("does not warn when automation target is routed", () => {
			const bass = instrument("bass", "./bass.wav", { root: "C2" });
			const auto = automate("sweep", "bass.hp.frequency", [{ time: 0, value: 80 }]);
			const warnings = validate(layer(note("C4", "4n").routeTo(bass), auto));
			expect(warnings.filter((w) => w.code === "ORPHANED_AUTOMATION")).toHaveLength(0);
		});
	});

	describe("DUPLICATE_ROUTING_NAME", () => {
		it("warns when two different instruments share the same name", () => {
			const bass1 = instrument("bass", "./bass1.wav", { root: "C2" });
			const bass2 = instrument("bass", "./bass2.wav", { root: "C2" });
			const warnings = validate(layer(note("C4", "4n").routeTo(bass1), note("E4", "4n").routeTo(bass2)));
			expect(warnings).toContainEqual(expect.objectContaining({ code: "DUPLICATE_ROUTING_NAME" }));
		});

		it("does not warn when same instrument is reused", () => {
			const bass = instrument("bass", "./bass.wav", { root: "C2" });
			const warnings = validate(layer(note("C4", "4n").routeTo(bass), note("E4", "4n").routeTo(bass)));
			expect(warnings.filter((w) => w.code === "DUPLICATE_ROUTING_NAME")).toHaveLength(0);
		});
	});

	describe("MISSING_SAMPLE", () => {
		it("warns when sample file does not exist with projectDir", () => {
			const bass = instrument("bass", "./nonexistent.wav", { root: "C2" });
			const warnings = validate(note("C4", "4n").routeTo(bass), { projectDir: "/tmp/fake-project" });
			expect(warnings).toContainEqual(expect.objectContaining({ code: "MISSING_SAMPLE" }));
		});

		it("does not check samples without projectDir", () => {
			const bass = instrument("bass", "./nonexistent.wav", { root: "C2" });
			const warnings = validate(note("C4", "4n").routeTo(bass));
			expect(warnings.filter((w) => w.code === "MISSING_SAMPLE")).toHaveLength(0);
		});

		it("checks kit mapping samples", () => {
			const drums = kit("drums", { C1: "./nonexistent-kick.wav" });
			const warnings = validate(note("C1", "4n").routeTo(drums), { projectDir: "/tmp/fake-project" });
			expect(warnings).toContainEqual(expect.objectContaining({ code: "MISSING_SAMPLE" }));
		});

		it("checks reverb impulse paths", () => {
			const bass = instrument("bass", "./nonexistent.wav", { root: "C2" })
				.routeTo(effects({ rev: reverb({ impulse: "./nonexistent-impulse.wav" }) }));
			const warnings = validate(note("C4", "4n").routeTo(bass), { projectDir: "/tmp/fake-project" });
			const missingSamples = warnings.filter((w) => w.code === "MISSING_SAMPLE");
			expect(missingSamples.some((w) => w.message.includes("impulse"))).toBe(true);
		});
	});

	describe("combined", () => {
		it("returns multiple warnings from a complex tree", () => {
			const auto = automate("sweep", "synth.hp.frequency", [{ time: 0, value: 80 }]);
			const warnings = validate(layer(sequence(), note("C4", "4n"), auto));
			const codes = warnings.map((w) => w.code);
			expect(codes).toContain("EMPTY_CONTAINER");
			expect(codes).toContain("ORPHANED_NOTES");
			expect(codes).toContain("ORPHANED_AUTOMATION");
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

		it("ignores sample patterns for orphaned notes", () => {
			const warnings = validate(sample("break", "./break.wav"));
			expect(warnings.filter((w) => w.code === "ORPHANED_NOTES")).toHaveLength(0);
		});
	});
});
