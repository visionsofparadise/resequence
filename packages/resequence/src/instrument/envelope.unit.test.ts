import { describe, expect, it, vi } from "vitest";
import { envelopes, filterEnvelope, isEnvelopesChain, pitchEnvelope, scheduleEnvelopeAdsr, volumeEnvelope } from "./envelope";
import { effects, gain, highpass } from "./effect";

function mockAudioParam(): AudioParam {
	return {
		setValueAtTime: vi.fn(),
		linearRampToValueAtTime: vi.fn(),
		exponentialRampToValueAtTime: vi.fn(),
		setTargetAtTime: vi.fn(),
		setValueCurveAtTime: vi.fn(),
		cancelScheduledValues: vi.fn(),
		cancelAndHoldAtTime: vi.fn(),
		value: 0,
		defaultValue: 0,
		minValue: -3.4028235e+38,
		maxValue: 3.4028235e+38,
		automationRate: "a-rate",
	} as unknown as AudioParam;
}

describe("volumeEnvelope", () => {
	it("creates a volume envelope with defaults", () => {
		const env = volumeEnvelope();
		expect(env.type).toBe("volumeEnvelope");
		expect(env.attack).toBeUndefined();
		expect(env.decay).toBeUndefined();
		expect(env.sustain).toBeUndefined();
		expect(env.release).toBeUndefined();
	});

	it("creates a volume envelope with custom values", () => {
		const env = volumeEnvelope({ attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.3 });
		expect(env).toEqual({ type: "volumeEnvelope", attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.3 });
	});
});

describe("filterEnvelope", () => {
	it("creates a filter envelope with required fields", () => {
		const env = filterEnvelope({ frequency: 200, amount: 0.8 });
		expect(env.type).toBe("filterEnvelope");
		expect(env.frequency).toBe(200);
		expect(env.amount).toBe(0.8);
		expect(env.mode).toBeUndefined();
	});

	it("creates a filter envelope with all fields", () => {
		const env = filterEnvelope({ frequency: 500, amount: -0.5, mode: "highpass", attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.4 });
		expect(env).toEqual({ type: "filterEnvelope", frequency: 500, amount: -0.5, mode: "highpass", attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.4 });
	});
});

describe("pitchEnvelope", () => {
	it("creates a pitch envelope with required fields", () => {
		const env = pitchEnvelope({ amount: 12 });
		expect(env.type).toBe("pitchEnvelope");
		expect(env.amount).toBe(12);
	});

	it("creates a pitch envelope with all fields", () => {
		const env = pitchEnvelope({ amount: -7, attack: 0.01, decay: 0.05, sustain: 0, release: 0.2 });
		expect(env).toEqual({ type: "pitchEnvelope", amount: -7, attack: 0.01, decay: 0.05, sustain: 0, release: 0.2 });
	});
});

describe("envelopes", () => {
	it("creates a frozen chain", () => {
		const chain = envelopes({ amp: volumeEnvelope() });
		expect(Object.isFrozen(chain)).toBe(true);
		expect(chain.amp?.type).toBe("volumeEnvelope");
	});

	it("supports multiple envelope types", () => {
		const chain = envelopes({
			amp: volumeEnvelope({ attack: 0.1 }),
			filter: filterEnvelope({ frequency: 1000, amount: 0.5 }),
			pitch: pitchEnvelope({ amount: 2 }),
		});
		expect(Object.keys(chain)).toEqual(["amp", "filter", "pitch"]);
	});
});

describe("isEnvelopesChain", () => {
	it("returns true for an envelopes chain", () => {
		const chain = envelopes({ amp: volumeEnvelope() });
		expect(isEnvelopesChain(chain)).toBe(true);
	});

	it("returns true for filter envelope chain", () => {
		const chain = envelopes({ flt: filterEnvelope({ frequency: 200, amount: 1 }) });
		expect(isEnvelopesChain(chain)).toBe(true);
	});

	it("returns true for pitch envelope chain", () => {
		const chain = envelopes({ bend: pitchEnvelope({ amount: 12 }) });
		expect(isEnvelopesChain(chain)).toBe(true);
	});

	it("returns false for an effects chain", () => {
		const chain = effects({ vol: gain({ level: -3 }), hp: highpass({ frequency: 80 }) });
		expect(isEnvelopesChain(chain)).toBe(false);
	});

	it("returns false for an empty chain", () => {
		expect(isEnvelopesChain({})).toBe(false);
	});
});

describe("scheduleEnvelopeAdsr", () => {
	it("schedules standard ADSR contour", () => {
		const param = mockAudioParam();
		scheduleEnvelopeAdsr(param, 1.0, 0.5, 0.01, 0.1, 0.7, 0.1, 1);

		expect(param.setValueAtTime).toHaveBeenCalledWith(0, 1.0);
		expect(param.linearRampToValueAtTime).toHaveBeenCalledWith(1, 1.01);
		expect(param.linearRampToValueAtTime).toHaveBeenCalledWith(0.7, 1.11);
		expect(param.setValueAtTime).toHaveBeenCalledWith(0.7, 1.5);
		expect(param.linearRampToValueAtTime).toHaveBeenCalledWith(0, 1.6);
	});

	it("schedules with custom peak value", () => {
		const param = mockAudioParam();
		scheduleEnvelopeAdsr(param, 0, 1.0, 0.01, 0.1, 0.5, 0.2, 12000);

		expect(param.setValueAtTime).toHaveBeenCalledWith(0, 0);
		expect(param.linearRampToValueAtTime).toHaveBeenCalledWith(12000, 0.01);
		expect(param.linearRampToValueAtTime).toHaveBeenCalledWith(6000, 0.11);
		expect(param.setValueAtTime).toHaveBeenCalledWith(6000, 1.0);
		expect(param.linearRampToValueAtTime).toHaveBeenCalledWith(0, 1.2);
	});

	it("schedules with zero sustain", () => {
		const param = mockAudioParam();
		scheduleEnvelopeAdsr(param, 0, 1.0, 0.01, 0.1, 0, 0.1, 1);

		expect(param.linearRampToValueAtTime).toHaveBeenCalledWith(0, 0.11);
		expect(param.setValueAtTime).toHaveBeenCalledWith(0, 1.0);
	});
});
