import type { RoutingEntry } from "../rendering/collect-routing";
import type { EffectsChain } from "./effect";
import type { EffectsGraphEntry } from "../rendering/schedule-context";

export function buildEffectsMap(routing: Map<string, RoutingEntry>, audioContext: BaseAudioContext, sampleBank: ReadonlyMap<string, AudioBuffer>): ReadonlyMap<string, EffectsGraphEntry> {
	const graph = new Map<string, EffectsGraphEntry>();

	for (const [name, entry] of routing) {
		const chain = entry.effects;

		if (!chain) {
			graph.set(name, { input: audioContext.destination, nodes: new Map() });

			continue;
		}

		const { input, nodes, output } = buildChain(chain, audioContext, sampleBank);

		output.connect(audioContext.destination);
		graph.set(name, { input, nodes });
	}

	return graph;
}

function buildChain(chain: EffectsChain, audioContext: BaseAudioContext, sampleBank: ReadonlyMap<string, AudioBuffer>): { input: AudioNode; nodes: Map<string, AudioNode>; output: AudioNode } {
	const nodes = new Map<string, AudioNode>();
	let firstNode: AudioNode | undefined;
	let prevNode: AudioNode | undefined;

	for (const [key, effect] of Object.entries(chain)) {
		let node: AudioNode;

		switch (effect.type) {
			case "gain": {
				const gainNode = audioContext.createGain();

				gainNode.gain.value = dbToLinear(effect.level);
				node = gainNode;

				break;
			}
			case "pan": {
				const panNode = audioContext.createStereoPanner();

				panNode.pan.value = effect.value;
				node = panNode;

				break;
			}
			case "filter": {
				const filterNode = audioContext.createBiquadFilter();

				filterNode.type = effect.mode;
				filterNode.frequency.value = effect.frequency;

				if (effect.resonance !== undefined) filterNode.Q.value = effect.resonance;

				node = filterNode;

				break;
			}
			case "compressor": {
				const compNode = audioContext.createDynamicsCompressor();

				compNode.threshold.value = effect.threshold;
				compNode.ratio.value = effect.ratio;

				if (effect.attack !== undefined) compNode.attack.value = effect.attack;
				if (effect.release !== undefined) compNode.release.value = effect.release;

				node = compNode;

				break;
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

				node = delayNode;

				break;
			}
			case "reverb": {
				const convolver = audioContext.createConvolver();
				const impulseBuffer = sampleBank.get(effect.impulse);

				if (impulseBuffer) convolver.buffer = impulseBuffer;

				node = convolver;

				break;
			}
		}

		nodes.set(key, node);
		firstNode ??= node;

		if (prevNode) prevNode.connect(node);

		prevNode = node;
	}

	return {
		input: firstNode ?? audioContext.destination,
		nodes,
		output: prevNode ?? audioContext.destination,
	};
}

function dbToLinear(db: number): number {
	return 10 ** (db / 20);
}
