import { PPQ } from "../utils/duration";

export function ticksToSeconds(ticks: number, tempo: number): number {
	return (ticks / PPQ) * (60 / tempo);
}
