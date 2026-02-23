import type { Keyframe } from "../patterns/automate";

export function invert(keyframes: ReadonlyArray<Keyframe>): Array<Keyframe> {
	return keyframes.map((keyframe) => ({
		time: keyframe.time,
		value: 1 - keyframe.value,
		curve: keyframe.curve,
	}));
}
