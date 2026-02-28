import { describe, expect, it } from "vitest";
import { audio } from "./patterns/audio";
import { automate } from "./patterns/automate";
import { layer } from "./patterns/layer";
import { metadata } from "./patterns/metadata";
import { note } from "./patterns/note";
import { repeat } from "./patterns/modifiers/repeat";
import { sequence } from "./patterns/sequence";
import { sampler } from "./units/generators/sampler";
import { resolveDuration } from "./utils/duration";
import { resolvePitch } from "./utils/pitch";
import { validate } from "./validate";

describe("validate", () => {
	describe("traversal", () => {
		it("returns warnings array", () => {
			const warnings = validate(sequence(note(resolvePitch("C4"), resolveDuration("4n"))));
			expect(Array.isArray(warnings)).toBe(true);
		});

		it("traverses through metadata without error", () => {
			const warnings = validate(metadata(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), { name: "test" }));
			expect(Array.isArray(warnings)).toBe(true);
		});

		it("traverses through repeat without error", () => {
			const warnings = validate(repeat(sequence(note(resolvePitch("C4"), resolveDuration("4n"))), 4));
			expect(Array.isArray(warnings)).toBe(true);
		});

		it("traverses audio patterns without error", () => {
			const warnings = validate(audio("break", "./break.wav", "4n"));
			expect(Array.isArray(warnings)).toBe(true);
		});

		it("registers automation paths during validation", () => {
			const auto = automate("sweep", "synth.hp.frequency", [{ time: 0, value: 80 }]);
			const warnings = validate(layer(sequence(), sequence(note(resolvePitch("C4"), resolveDuration("4n"))), auto));
			expect(Array.isArray(warnings)).toBe(true);
		});

		it("traverses routed patterns without error", () => {
			const bass = sampler("./bass.wav", { root: "C2", id: "bass" });
			const warnings = validate(sequence(note(resolvePitch("C4"), resolveDuration("4n")), note(resolvePitch("E4"), resolveDuration("4n"))).route(bass));
			expect(Array.isArray(warnings)).toBe(true);
		});
	});
});
