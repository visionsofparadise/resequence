import type { FilterMode } from "./effect";

export interface VolumeEnvelopeEffect {
	readonly type: "volumeEnvelope";
	readonly attack?: number;
	readonly decay?: number;
	readonly sustain?: number;
	readonly release?: number;
}

export interface FilterEnvelopeEffect {
	readonly type: "filterEnvelope";
	readonly attack?: number;
	readonly decay?: number;
	readonly sustain?: number;
	readonly release?: number;
	readonly frequency: number;
	readonly amount: number;
	readonly mode?: FilterMode;
}

export interface PitchEnvelopeEffect {
	readonly type: "pitchEnvelope";
	readonly attack?: number;
	readonly decay?: number;
	readonly sustain?: number;
	readonly release?: number;
	readonly amount: number;
}

export type EnvelopeEffect = VolumeEnvelopeEffect | FilterEnvelopeEffect | PitchEnvelopeEffect;
export type EnvelopesChain = Readonly<Record<string, EnvelopeEffect>>;

export function volumeEnvelope(adsr?: { attack?: number; decay?: number; sustain?: number; release?: number }): VolumeEnvelopeEffect {
	return { type: "volumeEnvelope", attack: adsr?.attack, decay: adsr?.decay, sustain: adsr?.sustain, release: adsr?.release };
}

export function filterEnvelope({
	frequency,
	amount,
	mode,
	attack,
	decay,
	sustain,
	release,
}: {
	frequency: number;
	amount: number;
	mode?: FilterMode;
	attack?: number;
	decay?: number;
	sustain?: number;
	release?: number;
}): FilterEnvelopeEffect {
	return { type: "filterEnvelope", frequency, amount, mode, attack, decay, sustain, release };
}

export function pitchEnvelope({ amount, attack, decay, sustain, release }: { amount: number; attack?: number; decay?: number; sustain?: number; release?: number }): PitchEnvelopeEffect {
	return { type: "pitchEnvelope", amount, attack, decay, sustain, release };
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
): { input?: AudioNode; output?: AudioNode; maxRelease: number } {
	const chainNodes: Array<AudioNode> = [];
	let maxRelease = 0;

	for (const envelope of Object.values(envelopesChain)) {
		const attack = envelope.attack ?? 0.01;
		const decay = envelope.decay ?? 0.1;
		const release = envelope.release ?? 0.1;

		if (release > maxRelease) maxRelease = release;

		switch (envelope.type) {
			case "volumeEnvelope": {
				const sustain = envelope.sustain ?? 0.7;
				const gainNode = audioContext.createGain();

				gainNode.gain.value = 0;
				scheduleEnvelopeAdsr(gainNode.gain, startTime, duration, attack, decay, sustain, release, 1);
				chainNodes.push(gainNode);

				break;
			}
			case "filterEnvelope": {
				const sustain = envelope.sustain ?? 0;
				const filterNode = audioContext.createBiquadFilter();

				filterNode.type = envelope.mode ?? "lowpass";
				filterNode.frequency.value = envelope.frequency;
				filterNode.detune.value = 0;

				scheduleEnvelopeAdsr(filterNode.detune, startTime, duration, attack, decay, sustain, release, envelope.amount * 12000);
				chainNodes.push(filterNode);

				break;
			}
			case "pitchEnvelope": {
				const sustain = envelope.sustain ?? 0;

				source.detune.value = 0;
				scheduleEnvelopeAdsr(source.detune, startTime, duration, attack, decay, sustain, release, envelope.amount * 100);

				break;
			}
		}
	}

	for (let index = 1; index < chainNodes.length; index++) {
		chainNodes[index - 1]!.connect(chainNodes[index]!);
	}

	return { input: chainNodes[0], output: chainNodes[chainNodes.length - 1], maxRelease };
}
