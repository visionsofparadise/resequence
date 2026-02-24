import { ResequenceError } from "../error";
import type { Duration } from "../utils/duration";
import type { Lfo, LfoShape } from "../utils/lfo";
import { resolveLfo, scheduleLfo } from "../utils/lfo";
import type { FilterMode } from "./effect";

export interface EnvelopeAdsr {
	readonly attack?: number;
	readonly hold?: number;
	readonly decay?: number;
	readonly sustain?: number;
	readonly release?: number;
	readonly amount?: number;
}

export interface VolumeEnvelopeEffect {
	readonly type: "volumeEnvelope";
	readonly envelope?: EnvelopeAdsr;
	readonly lfo?: Lfo;
}

export interface FilterEnvelopeEffect {
	readonly type: "filterEnvelope";
	readonly frequency: number;
	readonly resonance?: number;
	readonly mode?: FilterMode;
	readonly envelope?: EnvelopeAdsr & { readonly amount: number };
	readonly lfo?: Lfo;
}

export interface PitchEnvelopeEffect {
	readonly type: "pitchEnvelope";
	readonly envelope?: EnvelopeAdsr & { readonly amount: number };
	readonly lfo?: Lfo;
}

export type EnvelopeEffect = VolumeEnvelopeEffect | FilterEnvelopeEffect | PitchEnvelopeEffect;
export type EnvelopesChain = Readonly<Record<string, EnvelopeEffect>>;

interface LfoInput {
	readonly shape: LfoShape;
	readonly value: number;
	readonly frequency: number | Duration;
	readonly delay?: number;
	readonly attack?: number;
}

export function volumeEnvelope({ envelope, lfo }: { envelope?: EnvelopeAdsr; lfo?: LfoInput }): VolumeEnvelopeEffect {
	if (!envelope && !lfo) {
		throw new ResequenceError("INVALID_ENVELOPE", "volumeEnvelope(): at least one of envelope or lfo is required");
	}

	return {
		type: "volumeEnvelope",
		envelope,
		lfo: lfo ? resolveLfo(lfo) : undefined,
	};
}

export function filterEnvelope({
	frequency,
	resonance,
	mode,
	envelope,
	lfo,
}: {
	frequency: number;
	resonance?: number;
	mode?: FilterMode;
	envelope?: EnvelopeAdsr & { amount: number };
	lfo?: LfoInput;
}): FilterEnvelopeEffect {
	if (!envelope && !lfo) {
		throw new ResequenceError("INVALID_ENVELOPE", "filterEnvelope(): at least one of envelope or lfo is required");
	}

	return {
		type: "filterEnvelope",
		frequency,
		resonance,
		mode,
		envelope,
		lfo: lfo ? resolveLfo(lfo) : undefined,
	};
}

export function pitchEnvelope({ envelope, lfo }: { envelope?: EnvelopeAdsr & { amount: number }; lfo?: LfoInput }): PitchEnvelopeEffect {
	if (!envelope && !lfo) {
		throw new ResequenceError("INVALID_ENVELOPE", "pitchEnvelope(): at least one of envelope or lfo is required");
	}

	return {
		type: "pitchEnvelope",
		envelope,
		lfo: lfo ? resolveLfo(lfo) : undefined,
	};
}

export function envelopes(chain: Record<string, EnvelopeEffect>): EnvelopesChain {
	return Object.freeze({ ...chain });
}

const ENVELOPE_TYPES = new Set(["volumeEnvelope", "filterEnvelope", "pitchEnvelope"]);

export function isEnvelopesChain(chain: Readonly<Record<string, { readonly type: string }>>): chain is EnvelopesChain {
	const first = Object.values(chain)[0];

	if (!first) return false;

	return ENVELOPE_TYPES.has(first.type);
}

export function scheduleEnvelopeAdsr(audioParam: AudioParam, startTime: number, duration: number, attack: number, decay: number, sustain: number, release: number, peakValue: number): void {
	const sustainValue = peakValue * sustain;
	const noteOff = startTime + duration;

	audioParam.setValueAtTime(0, startTime);
	audioParam.linearRampToValueAtTime(peakValue, startTime + attack);
	audioParam.linearRampToValueAtTime(sustainValue, startTime + attack + decay);
	audioParam.setValueAtTime(sustainValue, noteOff);
	audioParam.linearRampToValueAtTime(0, noteOff + release);
}

export function buildPerVoiceChain(
	envelopesChain: EnvelopesChain,
	source: AudioBufferSourceNode,
	audioContext: BaseAudioContext,
	startTime: number,
	duration: number,
	tempo: number,
): { input?: AudioNode; output?: AudioNode; maxRelease: number } {
	const chainNodes: Array<AudioNode> = [];
	let maxRelease = 0;

	for (const envelope of Object.values(envelopesChain)) {
		switch (envelope.type) {
			case "volumeEnvelope": {
				const gainNode = audioContext.createGain();

				if (envelope.envelope) {
					const attack = envelope.envelope.attack ?? 0.01;
					const decay = envelope.envelope.decay ?? 0.1;
					const sustain = envelope.envelope.sustain ?? 0.7;
					const release = envelope.envelope.release ?? 0.1;

					if (release > maxRelease) maxRelease = release;

					gainNode.gain.value = 0;

					scheduleEnvelopeAdsr(gainNode.gain, startTime, duration, attack, decay, sustain, release, envelope.envelope.amount ?? 1);
				} else {
					gainNode.gain.value = 1;
				}

				if (envelope.lfo) {
					scheduleLfo(envelope.lfo, gainNode.gain, audioContext, startTime, startTime + duration + maxRelease, 1, tempo);
				}

				chainNodes.push(gainNode);
				break;
			}
			case "filterEnvelope": {
				const filterNode = audioContext.createBiquadFilter();

				filterNode.type = envelope.mode ?? "lowpass";
				filterNode.frequency.value = envelope.frequency;

				if (envelope.resonance !== undefined) filterNode.Q.value = envelope.resonance;
				filterNode.detune.value = 0;

				if (envelope.envelope) {
					const attack = envelope.envelope.attack ?? 0.01;
					const decay = envelope.envelope.decay ?? 0.1;
					const sustain = envelope.envelope.sustain ?? 0;
					const release = envelope.envelope.release ?? 0.1;

					if (release > maxRelease) maxRelease = release;

					scheduleEnvelopeAdsr(filterNode.detune, startTime, duration, attack, decay, sustain, release, envelope.envelope.amount * 12000);
				}

				if (envelope.lfo) {
					scheduleLfo(envelope.lfo, filterNode.detune, audioContext, startTime, startTime + duration + maxRelease, 100, tempo);
				}

				chainNodes.push(filterNode);
				break;
			}
			case "pitchEnvelope": {
				source.detune.value = 0;

				if (envelope.envelope) {
					const attack = envelope.envelope.attack ?? 0.01;
					const decay = envelope.envelope.decay ?? 0.1;
					const sustain = envelope.envelope.sustain ?? 0;
					const release = envelope.envelope.release ?? 0.1;

					if (release > maxRelease) maxRelease = release;

					scheduleEnvelopeAdsr(source.detune, startTime, duration, attack, decay, sustain, release, envelope.envelope.amount * 100);
				}

				if (envelope.lfo) {
					scheduleLfo(envelope.lfo, source.detune, audioContext, startTime, startTime + duration + maxRelease, 100, tempo);
				}

				break;
			}
		}
	}

	for (let index = 1; index < chainNodes.length; index++) {
		const prev = chainNodes[index - 1];
		const curr = chainNodes[index];
		if (prev && curr) prev.connect(curr);
	}

	return { input: chainNodes[0], output: chainNodes[chainNodes.length - 1], maxRelease };
}
