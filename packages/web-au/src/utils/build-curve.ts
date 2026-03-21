export function buildCurve(transform: (x: number) => number): Float32Array<ArrayBuffer> {
	const samples = 256;
	const curve = new Float32Array(samples);

	for (let index = 0; index < samples; index++) {
		const x = (index * 2) / (samples - 1) - 1;

		curve[index] = transform(x);
	}

	return curve;
}
