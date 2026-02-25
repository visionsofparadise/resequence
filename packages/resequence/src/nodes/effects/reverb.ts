import type { ScheduleContext } from "../../rendering/schedule-context";
import { getOrCreateDriver } from "../../rendering/schedule-context";
import type { NoteContext } from "../node";
import { EffectNode } from "./effect";

const COMB_DELAYS = [1116, 1188, 1277, 1356].map((samples) => samples / 44100);
const ALLPASS_DELAYS = [556, 441].map((samples) => samples / 44100);

export class ReverbEffectNode extends EffectNode {
	constructor(
		private readonly roomSize: number,
		private readonly damping: number,
		mix?: number,
		id?: string,
	) {
		super(mix ?? 0.5, id);
	}

	schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const combSumKey = `${this.effectsId}.combSum`;
		const node = scheduleContext.nodeMap.get(combSumKey);

		let combSumGain = node instanceof GainNode ? node : undefined;

		if (!combSumGain) {
			combSumGain = scheduleContext.audioContext.createGain();
			combSumGain.gain.value = 0.25;

			const combDelays: Array<DelayNode> = [];
			const combFeedbackGains: Array<GainNode> = [];
			const combLpfs: Array<BiquadFilterNode> = [];

			const lpfCutoff = lerp(10000, 500, this.damping);

			for (const delayTime of COMB_DELAYS) {
				const delayNode = scheduleContext.audioContext.createDelay(delayTime + 0.01);
				delayNode.delayTime.value = delayTime;

				const lpf = scheduleContext.audioContext.createBiquadFilter();
				lpf.type = "lowpass";
				lpf.frequency.value = lpfCutoff;

				const feedbackGain = scheduleContext.audioContext.createGain();
				feedbackGain.gain.value = this.roomSize;

				delayNode.connect(lpf);
				lpf.connect(feedbackGain);
				feedbackGain.connect(delayNode);
				delayNode.connect(combSumGain);

				combDelays.push(delayNode);
				combFeedbackGains.push(feedbackGain);
				combLpfs.push(lpf);
			}

			const allpasses: Array<BiquadFilterNode> = [];

			for (const delayTime of ALLPASS_DELAYS) {
				const allpass = scheduleContext.audioContext.createBiquadFilter();
				allpass.type = "allpass";
				allpass.frequency.value = 1 / delayTime;
				allpasses.push(allpass);
			}

			combSumGain.connect(allpasses[0]!);
			allpasses[0]!.connect(allpasses[1]!);

			if (this.id) {
				const roomSizeDriver = getOrCreateDriver(`${this.id}.roomSize`, this.roomSize, scheduleContext);
				const dampingDriver = getOrCreateDriver(`${this.id}.damping`, this.damping, scheduleContext);

				for (const feedbackGain of combFeedbackGains) {
					feedbackGain.gain.value = 0;
					roomSizeDriver.connect(feedbackGain.gain);
				}

				for (const lpf of combLpfs) {
					lpf.frequency.value = 0;
					dampingDriver.connect(lpf.frequency);
				}
			}

			scheduleContext.nodeMap.set(combSumKey, combSumGain);
			scheduleContext.nodeMap.set(`${this.effectsId}.allpass0`, allpasses[0]!);
			scheduleContext.nodeMap.set(`${this.effectsId}.allpass1`, allpasses[1]!);

			for (let combIndex = 0; combIndex < combDelays.length; combIndex++) {
				scheduleContext.nodeMap.set(`${this.effectsId}.comb${combIndex}`, combDelays[combIndex]!);
			}
		}

		const allpass1Node = scheduleContext.nodeMap.get(`${this.effectsId}.allpass1`);
		const tail = allpass1Node instanceof BiquadFilterNode ? allpass1Node : combSumGain;

		for (let combIndex = 0; combIndex < COMB_DELAYS.length; combIndex++) {
			const combNode = scheduleContext.nodeMap.get(`${this.effectsId}.comb${combIndex}`);

			if (combNode instanceof DelayNode) {
				audio.connect(combNode);
			}
		}

		this.forward(audio, [tail], noteContext, scheduleContext);
	}
}

export function reverb({ roomSize, damping, mix, id }: { roomSize: number; damping: number; mix?: number; id?: string }): ReverbEffectNode {
	return new ReverbEffectNode(roomSize, damping, mix, id);
}

function lerp(start: number, end: number, factor: number): number {
	return start + (end - start) * factor;
}
