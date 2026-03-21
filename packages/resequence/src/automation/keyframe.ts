export interface Keyframe {
	readonly beat: number;
	readonly value: number;
	readonly curve?: number;
	readonly step?: true;
}

export function applyCurve(progress: number, curve: number): number {
	if (curve === 0) return progress;
	if (curve > 0) return Math.pow(progress, 1 + curve * 3);

	return 1 - Math.pow(1 - progress, 1 + Math.abs(curve) * 3);
}

export function evaluateAt(keyframes: ReadonlyArray<Keyframe>, beat: number): number {
	let prevValue = 0;
	let prevBeat = 0;

	for (const kf of keyframes) {
		if (kf.beat > beat) {
			if (kf.step) return prevValue;

			const span = kf.beat - prevBeat;

			if (span === 0) return kf.value;

			const progress = (beat - prevBeat) / span;
			const curve = kf.curve ?? 0;
			const curved = applyCurve(progress, curve);

			return prevValue + (kf.value - prevValue) * curved;
		}

		prevValue = kf.value;
		prevBeat = kf.beat;
	}

	return prevValue;
}

const SAMPLE_INTERVAL_SEC = 0.005;

export function scheduleKeyframes(
	param: AudioParam,
	keyframes: ReadonlyArray<Keyframe>,
	beatToSeconds: (beat: number) => number,
	options?: { fromBeat?: number; toBeat?: number; initialValue?: number },
): void {
	if (keyframes.length === 0) return;

	const fromBeat = options?.fromBeat;
	const toBeat = options?.toBeat;

	if (options?.initialValue !== undefined) {
		const first = keyframes[0];
		const time = beatToSeconds(fromBeat ?? (first ? first.beat : 0));

		param.setValueAtTime(options.initialValue, time);
	}

	let prevBeat = fromBeat ?? 0;
	let prevValue = options?.initialValue ?? 0;

	for (const kf of keyframes) {
		if (fromBeat !== undefined && kf.beat < fromBeat) continue;
		if (toBeat !== undefined && kf.beat >= toBeat) continue;

		const timeSec = beatToSeconds(kf.beat);

		if (kf.step) {
			param.setValueAtTime(kf.value, timeSec);
		} else {
			const curve = kf.curve ?? 0;

			if (curve === 0) {
				param.linearRampToValueAtTime(kf.value, timeSec);
			} else {
				const prevTimeSec = beatToSeconds(prevBeat);
				const segmentDuration = timeSec - prevTimeSec;

				if (segmentDuration <= 0) {
					param.setValueAtTime(kf.value, timeSec);
				} else {
					const sampleCount = Math.max(2, Math.ceil(segmentDuration / SAMPLE_INTERVAL_SEC));
					const values = new Float32Array(sampleCount);

					for (let si = 0; si < sampleCount; si++) {
						const progress = si / (sampleCount - 1);
						const curved = applyCurve(progress, curve);

						values[si] = prevValue + (kf.value - prevValue) * curved;
					}

					param.setValueCurveAtTime(values, prevTimeSec, segmentDuration);
				}
			}
		}

		prevBeat = kf.beat;
		prevValue = kf.value;
	}
}
