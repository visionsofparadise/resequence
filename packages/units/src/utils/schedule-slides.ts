import type { NoteSlide } from "../note-event";

export function scheduleSlideRamps(
	param: AudioParam,
	baseValue: number,
	slides: ReadonlyArray<NoteSlide>,
	noteStartSec: number,
	centsToValue: (cents: number) => number,
): void {
	if (slides.length === 0) return;

	param.setValueAtTime(baseValue, noteStartSec);

	let prevTimeSec = noteStartSec;
	let prevValue = baseValue;

	for (const slide of slides) {
		const targetTimeSec = noteStartSec + slide.timeMs / 1000;
		const targetValue = centsToValue(slide.cents);

		if (targetTimeSec <= prevTimeSec) {
			param.setValueAtTime(targetValue, prevTimeSec);
		} else if (slide.curve === 0) {
			param.linearRampToValueAtTime(targetValue, targetTimeSec);
		} else {
			const segmentDuration = targetTimeSec - prevTimeSec;
			const sampleCount = Math.max(2, Math.ceil(segmentDuration / 0.005));
			const values = new Float32Array(sampleCount);

			for (let si = 0; si < sampleCount; si++) {
				const progress = si / (sampleCount - 1);
				const curved = applyCurve(progress, slide.curve);
				values[si] = prevValue + (targetValue - prevValue) * curved;
			}

			param.setValueCurveAtTime(values, prevTimeSec, segmentDuration);
		}

		prevTimeSec = targetTimeSec;
		prevValue = targetValue;
	}
}

function applyCurve(progress: number, curve: number): number {
	if (curve === 0) return progress;
	if (curve > 0) return Math.pow(progress, 1 + curve * 3);
	return 1 - Math.pow(1 - progress, 1 + Math.abs(curve) * 3);
}
