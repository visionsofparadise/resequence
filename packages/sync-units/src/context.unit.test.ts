import { describe, expect, it } from "vitest";
import { createUnitContext } from "./context";

describe("createUnitContext", () => {
	it("creates a context with all fields", () => {
		const audioContext = {} as BaseAudioContext;
		const getSample = () => Promise.resolve({} as AudioBuffer);
		const loadModule = () => Promise.resolve();

		const context = createUnitContext(audioContext, getSample, loadModule);

		expect(context.audioContext).toBe(audioContext);
		expect(context.driverMap).toBeInstanceOf(Map);
		expect(context.driverMap.size).toBe(0);
		expect(context.getSample).toBe(getSample);
		expect(context.loadModule).toBe(loadModule);
		expect(Object.isFrozen(context)).toBe(false);
	});
});
