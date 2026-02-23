import { describe, expect, it } from "vitest";
import { effects, gain, highpass } from "../instrument/effect";
import { instrument, kit } from "../instrument/instrument";
import { layer } from "./layer";
import type { NotePattern } from "./note";
import { note } from "./note";
import { RoutedPattern } from "./pattern";
import { repeat } from "./repeat";
import type { SequencePattern } from "./sequence";
import { sequence } from "./sequence";

describe("RoutedPattern", () => {
	const bass = instrument("bass", "./bass.wav", { root: "C2" });
	const drums = kit("drums", { C1: "./kick.wav", D1: "./snare.wav" });

	describe("pattern.routeTo(instrument)", () => {
		it("wraps note in RoutedPattern", () => {
			const routed = note("C4", "4n").routeTo(bass);
			expect(routed).toBeInstanceOf(RoutedPattern);
			expect(routed.type).toBe("routed");
			expect(routed.instrument).toBe(bass);
		});

		it("wraps sequence in RoutedPattern", () => {
			const routed = sequence(note("C4", "4n"), note("E4", "4n")).routeTo(bass);
			expect(routed).toBeInstanceOf(RoutedPattern);
		});

		it("wraps layer in RoutedPattern", () => {
			const routed = layer(note("C4", "4n"), note("E4", "4n")).routeTo(bass);
			expect(routed).toBeInstanceOf(RoutedPattern);
		});

		it("wraps repeat in RoutedPattern", () => {
			const routed = repeat(note("C4", "4n"), 4).routeTo(drums);
			expect(routed).toBeInstanceOf(RoutedPattern);
		});
	});

	describe("durationTicks", () => {
		it("delegates to child", () => {
			const routed = note("C4", "4n").routeTo(bass);
			expect(routed.durationTicks).toBe(480);
		});

		it("delegates sequence duration", () => {
			const routed = sequence(note("C4", "4n"), note("E4", "4n")).routeTo(bass);
			expect(routed.durationTicks).toBe(960);
		});
	});

	describe("transpose", () => {
		it("transposes child, preserves instrument", () => {
			const routed = note("C4", "4n").routeTo(bass);
			const transposed = routed.transpose(7);
			expect(transposed.instrument).toBe(bass);
			expect((transposed.node as NotePattern).pitch).toBe(67);
		});

		it("transposes through nested structure", () => {
			const routed = sequence(note("C4", "4n"), note("E4", "4n")).routeTo(bass);
			const transposed = routed.transpose(2);
			const inner = transposed.node as SequencePattern;
			expect((inner.nodes[0] as NotePattern).pitch).toBe(62);
			expect((inner.nodes[1] as NotePattern).pitch).toBe(66);
		});
	});

	describe("reverse", () => {
		it("reverses child, preserves instrument", () => {
			const routed = sequence(note("C4", "4n"), note("E4", "8n")).routeTo(bass);
			const reversed = routed.reverse();
			expect(reversed.instrument).toBe(bass);
			const inner = reversed.node as SequencePattern;
			expect((inner.nodes[0] as NotePattern).pitch).toBe("E4");
			expect((inner.nodes[1] as NotePattern).pitch).toBe("C4");
		});
	});

	describe("routeTo", () => {
		it("re-wraps with new instrument", () => {
			const routed = note("C4", "4n").routeTo(bass);
			const rerouted = routed.routeTo(drums);
			expect(rerouted.instrument).toBe(drums);
			expect(rerouted).toBeInstanceOf(RoutedPattern);
		});
	});

	describe("getMidi", () => {
		it("unwraps to child", () => {
			const pat = note("C4", "4n").routeTo(bass);
			expect(pat.getMidi()).toMatchObject([{ tick: 0, pitch: 60 }]);
		});

		it("propagates instrument name as trackName", () => {
			const pat = note("C4", "4n").routeTo(bass);
			const result = pat.getMidi();
			expect(result[0].trackName).toBe("bass");
		});

		it("propagates trackName through sequence", () => {
			const pat = sequence(note("C4", "4n"), note("E4", "4n")).routeTo(bass);
			const result = pat.getMidi();
			expect(result[0].trackName).toBe("bass");
			expect(result[1].trackName).toBe("bass");
		});

		it("explicit trackName overrides instrument name", () => {
			const pat = note("C4", "4n").routeTo(bass);
			const result = pat.getMidi(0, "override");
			expect(result[0].trackName).toBe("override");
		});
	});

	describe("instrument with effects", () => {
		it("preserves effects on instrument through routing", () => {
			const bassWithFx = bass.routeTo(
				effects({
					hp: highpass({ frequency: 80 }),
					vol: gain({ level: -3 }),
				}),
			);
			const routed = note("C4", "4n").routeTo(bassWithFx);
			expect(routed.instrument.effects).toBeDefined();
			expect(routed.instrument.effects!.hp.type).toBe("filter");
			expect(routed.instrument.effects!.vol.type).toBe("gain");
		});
	});
});
