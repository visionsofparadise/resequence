import { describe, expect, it } from "vitest";
import { gain } from "./gain";
import { FmEffectUnit, fm } from "./fm";

describe("fm", () => {
	it("creates an FmEffectUnit instance", () => {
		const modulator = gain({ level: 1 });
		const fx = fm({ modulator, depth: 100 });
		expect(fx).toBeInstanceOf(FmEffectUnit);
		expect(fx.type).toBe("fm");
	});

	it("accepts optional id", () => {
		const modulator = gain({ level: 1 });
		const fx = fm({ modulator, depth: 200, id: "fm-1" });
		expect(fx.id).toBe("fm-1");
	});

	it("collects sample keys from modulator", () => {
		const modulator = gain({ level: 1 });
		const fx = fm({ modulator, depth: 100 });
		const keys = fx.collectSampleKeys();
		expect(keys).toBeInstanceOf(Set);
	});
});
