import { describe, expect, it, vi } from "vitest";
import { resolveLfo } from "../utils/lfo";
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

describe("resolveLfo", () => {
	it("resolves Hz speed", () => {
		const lfo = resolveLfo({ shape: "sine", value: 0.3, frequency: 5 });
		expect(lfo.shape).toBe("sine");
		expect(lfo.value).toBe(0.3);
		expect(lfo.frequency).toBe(5);

		expect(lfo.delay).toBe(0);
		expect(lfo.attack).toBe(0);
	});

	it("resolves Duration speed", () => {
		const lfo = resolveLfo({ shape: "triangle", value: 12, frequency: "4n" });
		expect(lfo.frequency).toBeUndefined();
		expect(lfo.speedTicks).toBe(480);
	});

	it("applies delay and attack", () => {
		const lfo = resolveLfo({ shape: "sine", value: 0.5, frequency: 5, delay: 0.2, attack: 0.5 });
		expect(lfo.delay).toBe(0.2);
		expect(lfo.attack).toBe(0.5);
	});
});

describe("volumeEnvelope", () => {
	it("creates a volume envelope with envelope defaults", () => {
		const env = volumeEnvelope({ envelope: {} });
		expect(env.type).toBe("volumeEnvelope");
		expect(env.envelope).toEqual({});
		expect(env.lfo).toBeUndefined();
	});

	it("creates a volume envelope with custom ADSR", () => {
		const env = volumeEnvelope({ envelope: { attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.3 } });
		expect(env.envelope).toEqual({ attack: 0.05, decay: 0.2, sustain: 0.5, release: 0.3 });
	});

	it("creates a volume envelope with LFO only", () => {
		const env = volumeEnvelope({ lfo: { shape: "sine", value: 0.3, frequency: 5 } });
		expect(env.envelope).toBeUndefined();
		expect(env.lfo).toBeDefined();
		expect(env.lfo!.shape).toBe("sine");
	});

	it("throws without envelope or lfo", () => {
		expect(() => volumeEnvelope({} as never)).toThrow("at least one of envelope or lfo");
	});
});

describe("filterEnvelope", () => {
	it("creates a filter envelope with required fields", () => {
		const env = filterEnvelope({ frequency: 200, envelope: { amount: 0.8 } });
		expect(env.type).toBe("filterEnvelope");
		expect(env.frequency).toBe(200);
		expect(env.envelope!.amount).toBe(0.8);
		expect(env.mode).toBeUndefined();
	});

	it("creates a filter envelope with all fields", () => {
		const env = filterEnvelope({ frequency: 500, mode: "highpass", envelope: { amount: -0.5, attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.4 } });
		expect(env.frequency).toBe(500);
		expect(env.mode).toBe("highpass");
		expect(env.envelope).toEqual({ amount: -0.5, attack: 0.02, decay: 0.3, sustain: 0.1, release: 0.4 });
	});

	it("creates a filter envelope with LFO only", () => {
		const env = filterEnvelope({ frequency: 1000, lfo: { shape: "triangle", value: 12, frequency: "4n" } });
		expect(env.envelope).toBeUndefined();
		expect(env.lfo).toBeDefined();
	});

	it("creates with both envelope and LFO", () => {
		const env = filterEnvelope({ frequency: 1000, envelope: { amount: 0.8 }, lfo: { shape: "sine", value: 6, frequency: 4 } });
		expect(env.envelope).toBeDefined();
		expect(env.lfo).toBeDefined();
	});

	it("throws without envelope or lfo", () => {
		expect(() => filterEnvelope({ frequency: 1000 } as never)).toThrow("at least one of envelope or lfo");
	});
});

describe("pitchEnvelope", () => {
	it("creates a pitch envelope with required fields", () => {
		const env = pitchEnvelope({ envelope: { amount: 12 } });
		expect(env.type).toBe("pitchEnvelope");
		expect(env.envelope!.amount).toBe(12);
	});

	it("creates a pitch envelope with all fields", () => {
		const env = pitchEnvelope({ envelope: { amount: -7, attack: 0.01, decay: 0.05, sustain: 0, release: 0.2 } });
		expect(env.envelope).toEqual({ amount: -7, attack: 0.01, decay: 0.05, sustain: 0, release: 0.2 });
	});

	it("creates a pitch envelope with LFO only", () => {
		const env = pitchEnvelope({ lfo: { shape: "sine", value: 0.5, frequency: 5, delay: 0.2 } });
		expect(env.envelope).toBeUndefined();
		expect(env.lfo).toBeDefined();
		expect(env.lfo!.delay).toBe(0.2);
	});

	it("throws without envelope or lfo", () => {
		expect(() => pitchEnvelope({} as never)).toThrow("at least one of envelope or lfo");
	});
});

describe("envelopes", () => {
	it("creates a frozen chain", () => {
		const chain = envelopes({ amp: volumeEnvelope({ envelope: {} }) });
		expect(Object.isFrozen(chain)).toBe(true);
		expect(chain.amp?.type).toBe("volumeEnvelope");
	});

	it("supports multiple envelope types", () => {
		const chain = envelopes({
			amp: volumeEnvelope({ envelope: { attack: 0.1 } }),
			filter: filterEnvelope({ frequency: 1000, envelope: { amount: 0.5 } }),
			pitch: pitchEnvelope({ envelope: { amount: 2 } }),
		});
		expect(Object.keys(chain)).toEqual(["amp", "filter", "pitch"]);
	});
});

describe("isEnvelopesChain", () => {
	it("returns true for an envelopes chain", () => {
		const chain = envelopes({ amp: volumeEnvelope({ envelope: {} }) });
		expect(isEnvelopesChain(chain)).toBe(true);
	});

	it("returns true for filter envelope chain", () => {
		const chain = envelopes({ flt: filterEnvelope({ frequency: 200, envelope: { amount: 1 } }) });
		expect(isEnvelopesChain(chain)).toBe(true);
	});

	it("returns true for pitch envelope chain", () => {
		const chain = envelopes({ bend: pitchEnvelope({ envelope: { amount: 12 } }) });
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
