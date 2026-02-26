import { describe, expect, it } from "vitest";
import { gain } from "./gain";
import { compressor } from "./compressor";
import { CrossoverEffectUnit, crossover, multiband } from "./crossover";

describe("crossover", () => {
	it("creates a CrossoverEffectUnit instance", () => {
		const fx = crossover({
			low: [800, compressor({ threshold: -20, ratio: 4 })],
			high: [gain({ level: -3 })],
		});
		expect(fx).toBeInstanceOf(CrossoverEffectUnit);
		expect(fx.type).toBe("crossover");
	});

	it("accepts bands without processing units", () => {
		const fx = crossover({
			low: [800],
			high: [],
		});
		expect(fx).toBeInstanceOf(CrossoverEffectUnit);
	});

	it("multiband is an alias for crossover", () => {
		expect(multiband).toBe(crossover);
	});

	it("collects sample keys from band units", () => {
		const g = gain({ level: -3 });
		const fx = crossover({ low: [800, g], high: [] });
		const keys = fx.collectSampleKeys();
		expect(keys).toBeInstanceOf(Set);
	});
});
