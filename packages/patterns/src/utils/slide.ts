import type { Keyframe } from "../events";
import type { Pitch } from "../pitch";
import { denormalizePitch, normalizePitch, pitchToCents } from "../pitch";
import type { ResolvedTuning } from "../tuning";
import { evaluateAt } from "./keyframe";

export function evaluateSlideCents(noteRootPitch: Pitch, slides: ReadonlyArray<Keyframe>, beatOffset: number, tuning?: ResolvedTuning): number {
	if (slides.length === 0 || beatOffset <= 0) return 0;

	const last = slides[slides.length - 1];

	if (!last) return 0;

	if (beatOffset >= last.beat) {
		const pitch = denormalizePitch(last.value, noteRootPitch.stepsPerOctave, noteRootPitch.octaveRatio);

		return pitchToCents(noteRootPitch, pitch, tuning);
	}

	const startValue = normalizePitch(noteRootPitch);
	const allKeyframes: Array<Keyframe> = [{ beat: 0, value: startValue }, ...slides];
	const value = evaluateAt(allKeyframes, beatOffset);
	const pitch = denormalizePitch(value, noteRootPitch.stepsPerOctave, noteRootPitch.octaveRatio);

	return pitchToCents(noteRootPitch, pitch, tuning);
}
