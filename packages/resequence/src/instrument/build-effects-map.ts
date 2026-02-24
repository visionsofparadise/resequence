import type { RoutingEntry } from "../rendering/collect-routing";
import type { Effect } from "./effect";

export function buildEffectsMap(
	routing: Map<string, RoutingEntry>,
	audioContext: BaseAudioContext,
	sampleMap: ReadonlyMap<string, AudioBuffer>,
	driverMap: Map<string, ConstantSourceNode>,
): {
	effectsMap: Readonly<Record<string, AudioNode>>;
} {
	const effectsMap: Record<string, AudioNode> = {};

	for (const [name, entry] of routing) {
		const nodeChain: Array<AudioNode> = [];

		if (entry.effects) {
			for (const [key, effect] of Object.entries(entry.effects)) {
				const node = buildEffectNode(effect, audioContext, sampleMap);

				connectDrivers(node, effect.type, name, key, driverMap, audioContext);
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

		effectsMap[name] = nodeChain[0] ?? audioContext.destination;
	}

	return { effectsMap };
}

function connectDrivers(
	node: AudioNode,
	effectType: string,
	instrumentName: string,
	effectKey: string,
	driverMap: Map<string, ConstantSourceNode>,
	_audioContext: BaseAudioContext,
): void {
	const prefix = `${instrumentName}.${effectKey}`;

	switch (effectType) {
		case "gain": {
			const gainNode = node as GainNode;
			const driver = driverMap.get(`${prefix}.level`);
			if (driver) { gainNode.gain.value = 0; driver.connect(gainNode.gain); }
			break;
		}
		case "pan": {
			const panNode = node as StereoPannerNode;
			const driver = driverMap.get(`${prefix}.value`);
			if (driver) { panNode.pan.value = 0; driver.connect(panNode.pan); }
			break;
		}
		case "filter": {
			const filterNode = node as BiquadFilterNode;
			const freqDriver = driverMap.get(`${prefix}.frequency`);
			if (freqDriver) { filterNode.frequency.value = 0; freqDriver.connect(filterNode.frequency); }
			const resDriver = driverMap.get(`${prefix}.resonance`);
			if (resDriver) { filterNode.Q.value = 0; resDriver.connect(filterNode.Q); }
			break;
		}
		case "compressor": {
			const compNode = node as DynamicsCompressorNode;
			const threshDriver = driverMap.get(`${prefix}.threshold`);
			if (threshDriver) { compNode.threshold.value = 0; threshDriver.connect(compNode.threshold); }
			const ratioDriver = driverMap.get(`${prefix}.ratio`);
			if (ratioDriver) { compNode.ratio.value = 0; ratioDriver.connect(compNode.ratio); }
			const attackDriver = driverMap.get(`${prefix}.attack`);
			if (attackDriver) { compNode.attack.value = 0; attackDriver.connect(compNode.attack); }
			const releaseDriver = driverMap.get(`${prefix}.release`);
			if (releaseDriver) { compNode.release.value = 0; releaseDriver.connect(compNode.release); }
			break;
		}
		case "delay": {
			const delayNode = node as DelayNode;
			const driver = driverMap.get(`${prefix}.time`);
			if (driver) { delayNode.delayTime.value = 0; driver.connect(delayNode.delayTime); }
			break;
		}
	}
}

function buildEffectNode(effect: Effect, audioContext: BaseAudioContext, sampleMap: ReadonlyMap<string, AudioBuffer>): AudioNode {
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
			const impulseBuffer = sampleMap.get(effect.impulse);

			if (impulseBuffer) convolver.buffer = impulseBuffer;

			return convolver;
		}
	}
}

function dbToLinear(db: number): number {
	return 10 ** (db / 20);
}
