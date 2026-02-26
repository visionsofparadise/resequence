import type { KeyframeCurve } from "../patterns/automate";

export interface AbsolutePointKeyframe {
	readonly kind: "point";
	readonly beat: number;
	readonly value: number;
	readonly curve?: KeyframeCurve;
}

export interface AbsoluteCurveKeyframe {
	readonly kind: "curve";
	readonly beat: number;
	readonly durationBeats: number;
	readonly values: Float32Array;
}

export type AbsoluteKeyframe = AbsolutePointKeyframe | AbsoluteCurveKeyframe;

export function evaluateAt(keyframes: ReadonlyArray<AbsoluteKeyframe>, beat: number): number {
	let prevValue = 0;
	let prevBeat = 0;

	for (const kf of keyframes) {
		if (kf.kind !== "point") continue;

		if (kf.beat > beat) {
			const curve = kf.curve ?? "step";
			if (curve === "step") return prevValue;

			const fraction = (beat - prevBeat) / (kf.beat - prevBeat);

			if (curve === "linear") return prevValue + (kf.value - prevValue) * fraction;

			return prevValue * Math.pow(Math.max(kf.value / prevValue, 1e-6), fraction);
		}

		prevValue = kf.value;
		prevBeat = kf.beat;
	}

	return prevValue;
}

export function firstPointAt(keyframes: ReadonlyArray<AbsoluteKeyframe>, beat: number): AbsolutePointKeyframe | undefined {
	for (const kf of keyframes) {
		if (kf.kind !== "point") continue;
		if (kf.beat >= beat) return kf;
	}

	return undefined;
}

export function schedulePointKeyframe(param: AudioParam, kf: AbsolutePointKeyframe, timeSeconds: number): void {
	const curve = kf.curve ?? "step";

	if (curve === "step") {
		param.setValueAtTime(kf.value, timeSeconds);
	} else if (curve === "linear") {
		param.linearRampToValueAtTime(kf.value, timeSeconds);
	} else {
		param.exponentialRampToValueAtTime(Math.max(kf.value, 1e-6), timeSeconds);
	}
}
