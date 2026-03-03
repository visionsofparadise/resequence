import type { DriverEntry, ScheduleContext } from "../rendering/schedule-context";

export function getOrCreateDriver(
	path: string,
	defaultValue: number,
	context: ScheduleContext,
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
	param: AudioParam,
	path: string | undefined,
	value: number,
	range: readonly [number, number],
	context: ScheduleContext,
): void {
	if (path) {
		const [min, max] = range;
		const normalized = (value - min) / (max - min);
		const entry = getOrCreateDriver(path, normalized, context, range);

		const scaleGain = context.audioContext.createGain();
		scaleGain.gain.value = max - min;
		param.value = min;

		entry.node.connect(scaleGain);
		scaleGain.connect(param);
	} else {
		param.value = value;
	}
}

export function offsetParam(
	param: AudioParam,
	path: string | undefined,
	value: number,
	range: readonly [number, number],
	context: ScheduleContext,
): void {
	param.value = value;

	if (path) {
		const [min, max] = range;
		const entry = getOrCreateDriver(path, 0, context, range);

		const scaleGain = context.audioContext.createGain();
		scaleGain.gain.value = max - min;

		entry.node.connect(scaleGain);
		scaleGain.connect(param);
	}
}

export function undriveParam(path: string, param: AudioParam, context: ScheduleContext): void {
	try {
		context.driverMap.get(path)?.node.disconnect(param);
	} catch {
		// already disconnected (e.g. teardown ran before oscillator "ended" event)
	}
}

export function proxyDriver(id: string | undefined, key: string, childPath: string, context: ScheduleContext): void {
	if (!id) return;

	const childEntry = context.driverMap.get(childPath);
	if (!childEntry) return;

	const parentEntry = getOrCreateDriver(`${id}.${key}`, childEntry.node.offset.value, context, childEntry.range);

	childEntry.node.offset.value = 0;
	parentEntry.node.connect(childEntry.node.offset);
}
