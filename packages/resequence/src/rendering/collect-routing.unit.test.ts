import { describe, expect, it } from "vitest";
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

	it("first instance wins for duplicate names", () => {
		const pattern = sequence(audio("break", "./break1.wav", "1n"), audio("break", "./break2.wav", "1n"));
		const routing = collectRouting(pattern);

		expect(routing.size).toBe(1);
		if (routing.get("break")?.type === "audio") {
			expect(routing.get("break")?.path).toBe("./break1.wav");
		}
	});

});
