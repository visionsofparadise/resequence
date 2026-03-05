import { describe, expect, it } from "vitest";
import { automate, AutomationPattern, isAutomationEvent } from "./automate";

describe("automate", () => {
	it("returns an AutomationPattern", () => {
		const keyframes = [{ beat: 0, value: 0 }, { beat: 4, value: 1 }];
		const pattern = automate("filter", "synth.filter.cutoff", keyframes);
		expect(pattern).toBeInstanceOf(AutomationPattern);
		expect(pattern.endBeat).toBe(4);
	});

	it("emits automation event on schedule", () => {
		const keyframes = [{ beat: 0, value: 0 }, { beat: 4, value: 1 }];
		const pattern = automate("filter", "synth.filter.cutoff", keyframes);
		const events = pattern.schedule(0, 0, 4);
		const automationEvents = events.filter(isAutomationEvent);
		expect(automationEvents).toHaveLength(1);
		expect(automationEvents[0]!.type).toBe("automation");
		expect(automationEvents[0]!.name).toBe("filter");
		expect(automationEvents[0]!.durationBeats).toBe(4);
		expect(automationEvents[0]!.paths).toEqual(["synth.filter.cutoff"]);
		expect(automationEvents[0]!.source).toBe(keyframes);
	});

	it("creates LFO automation with endBeat 0", () => {
		const lfo = { shape: "sine" as const, value: 0.5, frequency: 4, delay: 0, attack: 0 };
		const pattern = automate("vibrato", "synth.osc.detune", lfo);
		expect(pattern.endBeat).toBe(0);
	});

	it("accepts string path and wraps to array", () => {
		const pattern = automate("x", "synth.gain", [{ beat: 0, value: 1 }]);
		expect(pattern.properties.paths).toEqual(["synth.gain"]);
	});

	it("throws on tempo path", () => {
		expect(() => automate("x", "tempo", [{ beat: 0, value: 1 }])).toThrow("tempo");
	});

	it("throws on invalid path format", () => {
		expect(() => automate("x", "noDot", [{ beat: 0, value: 1 }])).toThrow("nodeId.property");
	});

	it("throws on empty keyframes", () => {
		expect(() => automate("x", "a.b", [])).toThrow("empty");
	});
});

describe("AutomationPattern.is", () => {
	it("returns true for AutomationPattern instances", () => {
		const pattern = automate("test", "a.b", [{ beat: 0, value: 1 }]);
		expect(AutomationPattern.is(pattern)).toBe(true);
	});

	it("returns false for non-AutomationPattern values", () => {
		expect(AutomationPattern.is({})).toBe(false);
	});
});
