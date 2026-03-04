import type { Keyframe, Lfo } from "resequence";

export function isKeyframes(source: ReadonlyArray<Keyframe> | Lfo): source is ReadonlyArray<Keyframe> {
	return Array.isArray(source);
}
