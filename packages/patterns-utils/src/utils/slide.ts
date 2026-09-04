import { denormalizePitch, normalizePitch, pitchToCents } from "@resequence/patterns-core";
import { evaluateAt } from "./keyframe";
import type { Keyframe, Pitch, ResolvedTuning } from "@resequence/patterns-core";

export function evaluateSlide(noteStartPitch: Pitch, slides: ReadonlyArray<Keyframe>, beatOffset: number): Pitch {
	if (slides.length === 0 || beatOffset <= 0) return noteStartPitch;

	const last = slides[slides.length - 1];

	if (!last) return noteStartPitch;

	if (beatOffset >= last.beat) {
		return denormalizePitch(last.value, noteStartPitch.stepsPerOctave, noteStartPitch.octaveRatio);
	}

	const startValue = normalizePitch(noteStartPitch);
	const allKeyframes: Array<Keyframe> = [{ beat: 0, value: startValue }, ...slides];
	const value = evaluateAt(allKeyframes, beatOffset);

	return denormalizePitch(value, noteStartPitch.stepsPerOctave, noteStartPitch.octaveRatio);
}

export function mergeSlides(
	existing: ReadonlyArray<Keyframe>,
	incoming: ReadonlyArray<Keyframe>,
): ReadonlyArray<Keyframe> {
	const beatMap = new Map<number, Keyframe>();

	for (const slide of existing) {
		beatMap.set(slide.beat, slide);
	}

	for (const slide of incoming) {
		beatMap.set(slide.beat, slide);
	}

	return Array.from(beatMap.values()).sort((s1, s2) => s1.beat - s2.beat);
}

export function evaluateSlideCents(
	noteRootPitch: Pitch,
	slides: ReadonlyArray<Keyframe>,
	beatOffset: number,
	tuning?: ResolvedTuning,
): number {
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
