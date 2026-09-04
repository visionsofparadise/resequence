class BitcrushProcessor extends AudioWorkletProcessor {
	static get parameterDescriptors() {
		return [{ name: "bits", defaultValue: 8, minValue: 1, maxValue: 32, automationRate: "k-rate" }];
	}

	process(inputs, outputs, parameters) {
		const input = inputs[0];
		const output = outputs[0];
		const bits = parameters["bits"][0];
		const step = 1 / Math.pow(2, bits - 1);

		for (let channel = 0; channel < output.length; channel++) {
			const inputChannel = input?.[channel];
			const outputChannel = output[channel];

			if (outputChannel) {
				for (let sample = 0; sample < outputChannel.length; sample++) {
					const inputSample = inputChannel?.[sample] ?? 0;

					outputChannel[sample] = Math.round(inputSample / step) * step;
				}
			}
		}

		return true;
	}
}

registerProcessor("bitcrush-processor", BitcrushProcessor);
