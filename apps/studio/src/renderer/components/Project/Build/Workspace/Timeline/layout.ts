export const MIN_CLIP_HEIGHT = 36;

export function computeClipHeight(displayRange: number, pitchZoom: number): number {
	return Math.max((displayRange + 1) * pitchZoom, MIN_CLIP_HEIGHT);
}
