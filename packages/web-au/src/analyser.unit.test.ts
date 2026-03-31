import { describe, expect, it } from "vitest";
import { gain } from "./effects/gain";
import { analyser, AnalyserUnit } from "./analyser";

describe("analyser", () => {
	it("creates an AnalyserUnit with default fftSize", () => {
		const a = analyser();
		expect(a).toBeInstanceOf(AnalyserUnit);
		expect(a.fftSize).toBe(256);
	});

	it("accepts custom fftSize", () => {
		const a = analyser({ fftSize: 1024 });
		expect(a.fftSize).toBe(1024);
	});

	it("has correct type tuple", () => {
		const a = analyser();
		expect(a.type).toEqual(["unit"]);
	});

	it("has correct packageName and unitName", () => {
		const a = analyser();
		expect(a.packageName).toBe("@resequence/web-au");
		expect(a.unitName).toBe("analyser");
	});

	it("analyserNode is undefined before setup", () => {
		const a = analyser();
		expect(a.analyserNode).toBeUndefined();
	});

	it("can be wired to via .to()", () => {
		const g = gain({ level: 0 });
		const a = analyser();
		g.to(a);
		expect(g.targets).toContain(a);
	});

});
