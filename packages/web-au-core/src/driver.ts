import type { DriverEntry, UnitContext } from "./context";
import type { LiveParameter } from "./parameter";

export function getOrCreateDriver(
	path: string,
	defaultValue: number,
	context: UnitContext,
	range?: readonly [number, number],
): DriverEntry {
	const existing = context.driverMap.get(path);

	if (existing) return existing;

	const node = context.audioContext.createConstantSource();

	node.offset.value = defaultValue;
	node.start(0);

	const entry: DriverEntry = { node, range };

	context.driverMap.set(path, entry);

	return entry;
}

export function driveParam(
	audioParam: AudioParam,
	liveParam: LiveParameter,
	map: ((value: number) => number) | undefined,
	context: UnitContext,
): void {
	if (liveParam.path) {
		const [min, max] = [liveParam.min, liveParam.max];
		const mappedMin = map ? map(min) : min;
		const mappedMax = map ? map(max) : max;
		const entry = getOrCreateDriver(liveParam.path, liveParam.normalized, context, [min, max]);

		const scaleGain = context.audioContext.createGain();

		scaleGain.gain.value = mappedMax - mappedMin;
		audioParam.value = mappedMin;

		entry.node.connect(scaleGain);
		scaleGain.connect(audioParam);
		liveParam.bind(entry.node.offset, true);
	} else {
		audioParam.value = map ? map(liveParam.value) : liveParam.value;
		liveParam.bind(audioParam, false);
	}
}

export function offsetParam(
	audioParam: AudioParam,
	liveParam: LiveParameter,
	map: ((value: number) => number) | undefined,
	context: UnitContext,
): void {
	audioParam.value = map ? map(liveParam.value) : liveParam.value;

	if (liveParam.path) {
		const [min, max] = [liveParam.min, liveParam.max];
		const mappedMin = map ? map(min) : min;
		const mappedMax = map ? map(max) : max;
		const entry = getOrCreateDriver(liveParam.path, 0, context, [min, max]);

		const scaleGain = context.audioContext.createGain();

		scaleGain.gain.value = mappedMax - mappedMin;

		entry.node.connect(scaleGain);
		scaleGain.connect(audioParam);
		liveParam.bind(entry.node.offset, true);
	} else {
		liveParam.bind(audioParam, false);
	}
}

export function proxyDriver(
	parentParam: LiveParameter,
	childParam: LiveParameter,
	context: UnitContext,
): void {
	if (!parentParam.path || !childParam.path) return;

	const childEntry = context.driverMap.get(childParam.path);

	if (!childEntry) return;

	const parentEntry = getOrCreateDriver(parentParam.path, childEntry.node.offset.value, context, childEntry.range);

	childEntry.node.offset.value = 0;
	parentEntry.node.connect(childEntry.node.offset);
}

export function undriveParam(liveParam: LiveParameter, context: UnitContext): void {
	if (!liveParam.path) return;

	try {
		const entry = context.driverMap.get(liveParam.path);

		if (entry && liveParam.audioParam) entry.node.disconnect(liveParam.audioParam);
	} catch {
		// already disconnected
	}
}
