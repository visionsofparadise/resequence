import { describe, expect, it } from "vitest";
import { collectRouting } from "./collect-routing";
import { effects, gain, highpass } from "../instrument/effect";
import { instrument, kit } from "../instrument/instrument";
import { layer } from "../patterns/layer";
import { metadata } from "../patterns/metadata";
import { note } from "../patterns/note";
import { sample } from "../patterns/sample";
import { sequence } from "../patterns/sequence";

describe("collectRouting", () => {
	it("collects instrument routing from routed pattern", () => {
		const bass = instrument("bass", "./bass.wav", { root: "C2" });
		const pattern = note("C2", "4n").routeTo(bass);
		const routing = collectRouting(pattern);

		expect(routing.size).toBe(1);
		const entry = routing.get("bass");
		expect(entry?.type).toBe("instrument");
		if (entry?.type === "instrument") {
			expect(entry.instrument.name).toBe("bass");
		}
	});

	it("collects kit routing", () => {
		const drums = kit("drums", { C1: "./kick.wav", D1: "./snare.wav" });
		const pattern = note("C1", "4n").routeTo(drums);
		const routing = collectRouting(pattern);

		expect(routing.size).toBe(1);
		expect(routing.get("drums")?.type).toBe("instrument");
	});

	it("collects sample routing", () => {
		const pattern = sample("break", "./break.wav", "1n");
		const routing = collectRouting(pattern);

		expect(routing.size).toBe(1);
		const entry = routing.get("break");
		expect(entry?.type).toBe("sample");
		if (entry?.type === "sample") {
			expect(entry.path).toBe("./break.wav");
		}
	});

	it("collects sample with effects", () => {
		const pattern = sample("break", "./break.wav", "1n")
			.routeTo(effects({ vol: gain({ level: -6 }) }));
		const routing = collectRouting(pattern);

		const entry = routing.get("break");
		expect(entry?.type).toBe("sample");
		if (entry?.type === "sample") {
			expect(entry.effects).toBeDefined();
		}
	});

	it("first instance wins for duplicate names", () => {
		const bass1 = instrument("bass", "./bass1.wav", { root: "C2" });
		const bass2 = instrument("bass", "./bass2.wav", { root: "C3" });
		const pattern = layer(
			note("C2", "4n").routeTo(bass1),
			note("C3", "4n").routeTo(bass2),
		);
		const routing = collectRouting(pattern);

		expect(routing.size).toBe(1);
		if (routing.get("bass")?.type === "instrument") {
			expect(routing.get("bass")?.instrument.zones[0].sample).toBe("./bass1.wav");
		}
	});

	it("collects multiple different instruments", () => {
		const bass = instrument("bass", "./bass.wav", { root: "C2" });
		const pad = instrument("pad", "./pad.wav", { root: "C3" });
		const drums = kit("drums", { C1: "./kick.wav" });
		const pattern = layer(
			note("C2", "4n").routeTo(bass),
			note("C3", "4n").routeTo(pad),
			note("C1", "4n").routeTo(drums),
		);
		const routing = collectRouting(pattern);

		expect(routing.size).toBe(3);
		expect(routing.has("bass")).toBe(true);
		expect(routing.has("pad")).toBe(true);
		expect(routing.has("drums")).toBe(true);
	});

	it("collects instruments with effects chains", () => {
		const bass = instrument("bass", "./bass.wav", { root: "C2" })
			.routeTo(effects({ hp: highpass({ frequency: 80 }), vol: gain({ level: -3 }) }));
		const pattern = note("C2", "4n").routeTo(bass);
		const routing = collectRouting(pattern);

		if (routing.get("bass")?.type === "instrument") {
			expect(routing.get("bass")?.instrument.effects).toBeDefined();
		}
	});

	it("finds routing through metadata", () => {
		const bass = instrument("bass", "./bass.wav", { root: "C2" });
		const pattern = metadata(note("C2", "4n").routeTo(bass), { tempo: 120 });
		const routing = collectRouting(pattern);

		expect(routing.size).toBe(1);
		expect(routing.has("bass")).toBe(true);
	});

	it("finds routing inside sequence", () => {
		const bass = instrument("bass", "./bass.wav", { root: "C2" });
		const pattern = sequence(
			note("C2", "4n").routeTo(bass),
			note("D2", "4n").routeTo(bass),
		);
		const routing = collectRouting(pattern);

		expect(routing.size).toBe(1);
	});
});
