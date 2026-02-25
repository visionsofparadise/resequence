class DownsampleProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors() {
		return [
			{ name: "targetRate", defaultValue: 22050, minValue: 100, maxValue: 192000, automationRate: "k-rate" },
		];
	}

	constructor(options) {
		super(options);
		this._heldSamples = [];
		this._counter = 0;
	}

	process(inputs, outputs, parameters) {
		const input = inputs[0];
		const output = outputs[0];
		const targetRate = parameters["targetRate"][0];
		const step = Math.max(1, Math.floor(sampleRate / targetRate));

		for (let channel = 0; channel < output.length; channel++) {
			if (!this._heldSamples[channel]) {
				this._heldSamples[channel] = 0;
			}

			const inputChannel = input?.[channel];
			const outputChannel = output[channel];

			if (outputChannel) {
				for (let sample = 0; sample < outputChannel.length; sample++) {
					if ((this._counter + sample) % step === 0) {
						this._heldSamples[channel] = inputChannel?.[sample] ?? 0;
					}
					outputChannel[sample] = this._heldSamples[channel];
				}
			}
		}

		this._counter = (this._counter + (output[0]?.length ?? 128)) % step;

		return true;
	}
}

registerProcessor("downsample-processor", DownsampleProcessor);
