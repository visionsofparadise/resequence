export interface TempoPoint {
	readonly tick: number;
	readonly bpm: number;
}

export function tickToMs(tick: number, tempoMap: ReadonlyArray<TempoPoint>, ppq: number): number {
	let ms = 0;
	let lastTick = 0;
	let bpm = 120;

	for (const point of tempoMap) {
		if (point.tick >= tick) break;

		const segmentTicks = point.tick - lastTick;

		ms += (segmentTicks / ppq) * (60000 / bpm);
		lastTick = point.tick;
		bpm = point.bpm;
	}

	const remainingTicks = tick - lastTick;
	ms += (remainingTicks / ppq) * (60000 / bpm);

	return ms;
}
