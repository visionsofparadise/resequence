class NoiseProcessor extends AudioWorkletProcessor {
	constructor(options) {
		super(options);

		const { color = "white", seed } = options?.processorOptions ?? {};

		this._color = color;
		this._rng = seed !== undefined ? mulberry32(seed) : () => Math.random();
		this._lastBrown = 0;
		this._b0 = 0;
		this._b1 = 0;
		this._b2 = 0;
		this._b3 = 0;
		this._b4 = 0;
		this._b5 = 0;
		this._b6 = 0;
	}

	_generateSample() {
		const white = this._rng() * 2 - 1;

		if (this._color === "white") {
			return white;
		}

		if (this._color === "pink") {
			this._b0 = 0.99886 * this._b0 + white * 0.0555179;
			this._b1 = 0.99332 * this._b1 + white * 0.0750759;
			this._b2 = 0.96900 * this._b2 + white * 0.1538520;
			this._b3 = 0.86650 * this._b3 + white * 0.3104856;
			this._b4 = 0.55000 * this._b4 + white * 0.5329522;
			this._b5 = -0.7616 * this._b5 - white * 0.0168980;
			const pink = this._b0 + this._b1 + this._b2 + this._b3 + this._b4 + this._b5 + this._b6 + white * 0.5362;
			this._b6 = white * 0.115926;
			return pink * 0.11;
		}

		this._lastBrown = (this._lastBrown + 0.02 * white) / 1.02;
		return this._lastBrown * 3.5;
	}

	process(_inputs, outputs) {
		const output = outputs[0];

		for (let channel = 0; channel < output.length; channel++) {
			const outputChannel = output[channel];
			for (let i = 0; i < outputChannel.length; i++) {
				outputChannel[i] = this._generateSample();
			}
		}

		return true;
	}
}

function mulberry32(seed) {
	let s = seed;
	return () => {
		s = (s + 0x6D2B79F5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

registerProcessor("noise-processor", NoiseProcessor);
