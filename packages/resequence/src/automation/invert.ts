import type { AutomationPoint } from "../patterns/automate";

export function invert(points: ReadonlyArray<AutomationPoint>): Array<AutomationPoint> {
	return points.map((point) => ({
		time: point.time,
		value: 1 - point.value,
		curve: point.curve,
	}));
}
