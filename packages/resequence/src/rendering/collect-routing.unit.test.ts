import { describe, expect, it } from "vitest";
import { layer } from "../patterns/layer";
import { metadata } from "../patterns/metadata";
import { audio } from "../patterns/audio";
import { sequence } from "../patterns/sequence";
import { collectRouting } from "./collect-routing";

describe("collectRouting", () => {
	it("collects sample routing", () => {
		const pattern = audio("break", "./break.wav", "1n");
		const routing = collectRouting(pattern);

		expect(routing.size).toBe(1);
		const entry = routing.get("break");
		expect(entry?.type).toBe("audio");
		if (entry?.type === "audio") {
			expect(entry.path).toBe("./break.wav");
		}
	});

	it("collects multiple different samples", () => {
		const pattern = layer(audio("break", "./break.wav", "1n"), audio("loop", "./loop.wav", "1n"));
		const routing = collectRouting(pattern);

		expect(routing.size).toBe(2);
		expect(routing.has("break")).toBe(true);
		expect(routing.has("loop")).toBe(true);
	});

	it("first instance wins for duplicate names", () => {
		const pattern = sequence(audio("break", "./break1.wav", "1n"), audio("break", "./break2.wav", "1n"));
		const routing = collectRouting(pattern);

		expect(routing.size).toBe(1);
		if (routing.get("break")?.type === "audio") {
			expect(routing.get("break")?.path).toBe("./break1.wav");
		}
	});

	it("finds routing through metadata", () => {
		const pattern = metadata(audio("break", "./break.wav", "1n"), { tempo: 120 });
		const routing = collectRouting(pattern);

		expect(routing.size).toBe(1);
		expect(routing.has("break")).toBe(true);
	});

	it("finds routing inside layer", () => {
		const pattern = layer(audio("break", "./break.wav", "1n"), audio("loop", "./loop.wav", "1n"));
		const routing = collectRouting(pattern);

		expect(routing.size).toBe(2);
	});

	it("finds routing inside sequence", () => {
		const pattern = sequence(audio("break", "./break.wav", "1n"), audio("loop", "./loop.wav", "1n"));
		const routing = collectRouting(pattern);

		expect(routing.size).toBe(2);
	});

	it("returns empty map when no samples", () => {
		const pattern = metadata(audio("break", "./break.wav"), { tempo: 120 });
		const routing = collectRouting(pattern);

		expect(routing.has("break")).toBe(true);
	});
});
