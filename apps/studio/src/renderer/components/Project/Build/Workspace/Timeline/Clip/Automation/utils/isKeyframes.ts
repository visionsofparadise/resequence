import type { Keyframe } from "resequence";
import type { Lfo } from "resequence";

export function isKeyframes(source: ReadonlyArray<Keyframe> | Lfo): source is ReadonlyArray<Keyframe> {
	return Array.isArray(source);
}
