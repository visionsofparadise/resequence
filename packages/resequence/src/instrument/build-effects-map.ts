import type { RoutingEntry } from "../rendering/collect-routing";
import type { EffectsGraphEntry } from "../rendering/schedule-context";
import type { Effect } from "./effect";
import type { EnvelopeEffect, EnvelopesChain } from "./envelope";

export function buildEffectsMap(
	routing: Map<string, RoutingEntry>,
	audioContext: BaseAudioContext,
	sampleBank: ReadonlyMap<string, AudioBuffer>,
): {
	effectsMap: Readonly<Record<string, EffectsGraphEntry>>;
	inputMap: Readonly<Record<string, AudioNode>>;
	envelopesMap: Readonly<Record<string, EnvelopesChain>>;
} {
	const effectsMap: Record<string, EffectsGraphEntry> = {};
	const inputMap: Record<string, AudioNode> = {};
	const envelopesMap: Record<string, EnvelopesChain> = {};

	for (const [name, entry] of routing) {
		const allNodes: Record<string, AudioNode> = {};
		const nodeChain: Array<AudioNode> = [];

		if (entry.envelopes) {
			envelopesMap[name] = entry.envelopes;

			for (const [key, envelope] of Object.entries(entry.envelopes)) {
				const node = buildEnvelopeNode(envelope, audioContext);

				if (node) {
					allNodes[key] = node;
					nodeChain.push(node);
				}
			}
		}

		if (entry.effects) {
			for (const [key, effect] of Object.entries(entry.effects)) {
				const node = buildEffectNode(effect, audioContext, sampleBank);

				allNodes[key] = node;
				nodeChain.push(node);
			}
		}

		for (let index = 1; index < nodeChain.length; index++) {
			const prev = nodeChain[index - 1];
			const curr = nodeChain[index];

			if (prev && curr) prev.connect(curr);
		}

		const lastNode = nodeChain[nodeChain.length - 1];

		if (lastNode) lastNode.connect(audioContext.destination);

		effectsMap[name] = allNodes;
		inputMap[name] = nodeChain[0] ?? audioContext.destination;
	}

	return { effectsMap, inputMap, envelopesMap };
}

function buildEnvelopeNode(envelope: EnvelopeEffect, audioContext: BaseAudioContext): AudioNode | undefined {
	switch (envelope.type) {
		case "volumeEnvelope": {
			const gainNode = audioContext.createGain();

			gainNode.gain.value = 1;

			return gainNode;
		}
		case "filterEnvelope": {
			const filterNode = audioContext.createBiquadFilter();

			filterNode.type = envelope.mode ?? "lowpass";
			filterNode.frequency.value = envelope.frequency;

			if (envelope.resonance !== undefined) filterNode.Q.value = envelope.resonance;

			return filterNode;
		}
		case "pitchEnvelope": {
			return undefined;
		}
	}
}

function buildEffectNode(effect: Effect, audioContext: BaseAudioContext, sampleBank: ReadonlyMap<string, AudioBuffer>): AudioNode {
	switch (effect.type) {
		case "gain": {
			const gainNode = audioContext.createGain();

			gainNode.gain.value = dbToLinear(effect.level);

			return gainNode;
		}
		case "pan": {
			const panNode = audioContext.createStereoPanner();

			panNode.pan.value = effect.value;

			return panNode;
		}
		case "filter": {
			const filterNode = audioContext.createBiquadFilter();

			filterNode.type = effect.mode;
			filterNode.frequency.value = effect.frequency;

			if (effect.resonance !== undefined) filterNode.Q.value = effect.resonance;

			return filterNode;
		}
		case "compressor": {
			const compNode = audioContext.createDynamicsCompressor();

			compNode.threshold.value = effect.threshold;
			compNode.ratio.value = effect.ratio;

			if (effect.attack !== undefined) compNode.attack.value = effect.attack;
			if (effect.release !== undefined) compNode.release.value = effect.release;

			return compNode;
		}
		case "delay": {
			const delayNode = audioContext.createDelay(effect.time + 1);

			delayNode.delayTime.value = effect.time;

			if (effect.feedback !== undefined && effect.feedback > 0) {
				const feedbackGain = audioContext.createGain();

				feedbackGain.gain.value = effect.feedback;
				delayNode.connect(feedbackGain);
				feedbackGain.connect(delayNode);
			}

			return delayNode;
		}
		case "reverb": {
			const convolver = audioContext.createConvolver();
			const impulseBuffer = sampleBank.get(effect.impulse);

			if (impulseBuffer) convolver.buffer = impulseBuffer;

			return convolver;
		}
	}
}

function dbToLinear(db: number): number {
	return 10 ** (db / 20);
}
