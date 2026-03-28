import type { Keyframe } from "@resequence/patterns-core";

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
