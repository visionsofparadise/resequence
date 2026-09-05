import { applyCurve } from "@resequence/patterns-utils";
import type { Keyframe } from "@resequence/patterns-core";

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
