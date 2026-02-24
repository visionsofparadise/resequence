import type { AnyKeyframe, CurveKeyframe, Keyframe } from "../patterns/automate";

export function invert(keyframes: ReadonlyArray<AnyKeyframe>): Array<AnyKeyframe> {
	return keyframes.map((keyframe): AnyKeyframe => {
		if ("values" in keyframe) {
			return {
				time: keyframe.time,
				duration: keyframe.duration,
				values: Float32Array.from(keyframe.values, (value) => 1 - value),
			} satisfies CurveKeyframe;
		}

		return {
			time: keyframe.time,
			value: 1 - keyframe.value,
			curve: keyframe.curve,
		} satisfies Keyframe;
	});
}
