class EnvelopeProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors() {
		return [
			{ name: "gate",    defaultValue: 0,    minValue: 0, maxValue: 1,   automationRate: "a-rate" },
			{ name: "attack",  defaultValue: 0.01, minValue: 0, maxValue: 100, automationRate: "k-rate" },
			{ name: "hold",    defaultValue: 0,    minValue: 0, maxValue: 100, automationRate: "k-rate" },
			{ name: "decay",   defaultValue: 0.1,  minValue: 0, maxValue: 100, automationRate: "k-rate" },
			{ name: "sustain", defaultValue: 0.7,  minValue: 0, maxValue: 1,   automationRate: "k-rate" },
			{ name: "release", defaultValue: 0.1,  minValue: 0, maxValue: 100, automationRate: "k-rate" },
		];
	}

	constructor() {
		super();
		this._state = "idle";
		this._envValue = 0;
		this._stateTime = 0;
		this._prevGate = 0;
	}

	process(inputs, outputs, parameters) {
		const input = inputs[0];
		const output = outputs[0];
		const gate = parameters["gate"];
		const attack = parameters["attack"][0];
		const hold = parameters["hold"][0];
		const decay = parameters["decay"][0];
		const sustain = parameters["sustain"][0];
		const release = parameters["release"][0];

		const blockSize = output[0]?.length ?? 128;
		const sampleDuration = 1 / sampleRate;

		for (let sample = 0; sample < blockSize; sample++) {
			const gateValue = gate.length > 1 ? gate[sample] : gate[0];
			const prevGate = sample === 0 ? this._prevGate : (gate.length > 1 ? gate[sample - 1] : gate[0]);

			if (prevGate < 0.5 && gateValue >= 0.5) {
				this._state = "attack";
				this._stateTime = 0;
			} else if (prevGate >= 0.5 && gateValue < 0.5) {
				this._state = "release";
				this._stateTime = 0;
			}

			switch (this._state) {
				case "attack":
					if (attack <= 0) {
						this._envValue = 1;
						this._state = hold > 0 ? "hold" : "decay";
						this._stateTime = 0;
					} else {
						this._envValue = this._stateTime / attack;
						this._stateTime += sampleDuration;

						if (this._stateTime >= attack) {
							this._envValue = 1;
							this._state = hold > 0 ? "hold" : "decay";
							this._stateTime = 0;
						}
					}

					break;
				case "hold":
					this._envValue = 1;
					this._stateTime += sampleDuration;

					if (this._stateTime >= hold) {
						this._state = "decay";
						this._stateTime = 0;
					}

					break;
				case "decay":
					if (decay <= 0) {
						this._envValue = sustain;
						this._state = "sustain";
					} else {
						this._envValue = 1 - (1 - sustain) * (this._stateTime / decay);
						this._stateTime += sampleDuration;

						if (this._stateTime >= decay) {
							this._envValue = sustain;
							this._state = "sustain";
						}
					}

					break;
				case "sustain":
					this._envValue = sustain;

					break;
				case "release":
					if (release <= 0) {
						this._envValue = 0;
						this._state = "idle";
					} else {
						this._envValue = Math.max(0, this._envValue - (this._envValue / release) * sampleDuration);
						this._stateTime += sampleDuration;

						if (this._stateTime >= release) {
							this._envValue = 0;
							this._state = "idle";
						}
					}

					break;
				case "idle":
					this._envValue = 0;

					break;
			}

			for (let channel = 0; channel < output.length; channel++) {
				const inputChannel = input?.[channel];
				const outputChannel = output[channel];
				
				if (outputChannel) {
					outputChannel[sample] = (inputChannel?.[sample] ?? 0) * this._envValue;
				}
			}
		}

		if (gate.length > 1) {
			this._prevGate = gate[blockSize - 1] ?? 0;
		} else {
			this._prevGate = gate[0] ?? 0;
		}

		return true;
	}
}

registerProcessor("envelope-processor", EnvelopeProcessor);
