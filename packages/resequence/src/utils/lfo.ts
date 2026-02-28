export type LfoShape = "sine" | "sawtooth" | "triangle" | "square";

export interface Lfo {
	readonly shape: LfoShape;
	readonly value: number;
	readonly frequency: number;
	readonly delay: number;
	readonly attack: number;
}

export function resolveLfo(lfo: { shape: LfoShape; value: number; frequency: number; delay?: number; attack?: number }): Lfo {
	return {
		shape: lfo.shape,
		value: lfo.value,
		frequency: lfo.frequency,
		delay: lfo.delay ?? 0,
		attack: lfo.attack ?? 0,
	};
}

export function scheduleLfo(lfo: Lfo, target: AudioParam, audioContext: BaseAudioContext, startTime: number, stopTime: number, depthScale: number): void {
	const osc = audioContext.createOscillator();

	osc.type = lfo.shape;
	osc.frequency.value = lfo.frequency;

	const depthGain = audioContext.createGain();
	const fullDepth = lfo.value * depthScale;

	if (lfo.attack > 0) {
		depthGain.gain.setValueAtTime(0, startTime + lfo.delay);
		depthGain.gain.linearRampToValueAtTime(fullDepth, startTime + lfo.delay + lfo.attack);
	} else {
		depthGain.gain.value = fullDepth;
	}

	osc.connect(depthGain);
	depthGain.connect(target);
	osc.start(startTime + lfo.delay);
	osc.stop(stopTime);
}
