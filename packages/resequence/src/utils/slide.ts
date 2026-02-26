import type { ScoreSlide } from "../patterns/pattern";
import type { Pitch, TuningConfig } from "./pitch";
import { addSteps, pitchToCents } from "./pitch";

function applyCurve(progress: number, curve: number): number {
	if (curve === 0) return progress;
	if (curve > 0) return Math.pow(progress, 1 + curve * 3);
	return 1 - Math.pow(1 - progress, 1 + Math.abs(curve) * 3);
}

function lerpPitch(from: Pitch, to: Pitch, progress: number): Pitch {
	const fromKey = from.octave * from.stepsPerOctave + from.class;
	const toKey = to.octave * to.stepsPerOctave + to.class;
	const steps = (toKey - fromKey) * progress;
	return addSteps(from, Math.round(steps));
}

export function evaluateSlide(
	noteStartPitch: Pitch,
	slides: ReadonlyArray<ScoreSlide>,
	beatOffset: number,
): Pitch {
	if (slides.length === 0 || beatOffset <= 0) return noteStartPitch;

	const last = slides[slides.length - 1]!;
	if (beatOffset >= last.beat) return last.pitch;

	let prevBeat = 0;
	let prevPitch = noteStartPitch;

	for (const slide of slides) {
		if (beatOffset <= slide.beat) {
			const span = slide.beat - prevBeat;
			if (span === 0) return slide.pitch;
			const raw = (beatOffset - prevBeat) / span;
			const curved = applyCurve(raw, slide.curve);
			return lerpPitch(prevPitch, slide.pitch, curved);
		}
		prevBeat = slide.beat;
		prevPitch = slide.pitch;
	}

	return last.pitch;
}

export function evaluateSlideCents(
	noteRootPitch: Pitch,
	slides: ReadonlyArray<ScoreSlide>,
	beatOffset: number,
	tuning?: TuningConfig,
): number {
	if (slides.length === 0 || beatOffset <= 0) return 0;

	const last = slides[slides.length - 1]!;
	if (beatOffset >= last.beat) {
		return pitchToCents(noteRootPitch, last.pitch, tuning);
	}

	let prevBeat = 0;
	let prevCents = 0;

	for (const slide of slides) {
		const slideCents = pitchToCents(noteRootPitch, slide.pitch, tuning);

		if (beatOffset <= slide.beat) {
			const span = slide.beat - prevBeat;
			if (span === 0) return slideCents;
			const raw = (beatOffset - prevBeat) / span;
			const curved = applyCurve(raw, slide.curve);
			return prevCents + (slideCents - prevCents) * curved;
		}

		prevBeat = slide.beat;
		prevCents = slideCents;
	}

	return pitchToCents(noteRootPitch, last.pitch, tuning);
}

export function mergeSlides(
	existing: ReadonlyArray<ScoreSlide>,
	incoming: ReadonlyArray<ScoreSlide>,
): ReadonlyArray<ScoreSlide> {
	const beatMap = new Map<number, ScoreSlide>();

	for (const slide of existing) {
		beatMap.set(slide.beat, slide);
	}

	for (const slide of incoming) {
		beatMap.set(slide.beat, slide);
	}

	return Array.from(beatMap.values()).sort((s1, s2) => s1.beat - s2.beat);
}
