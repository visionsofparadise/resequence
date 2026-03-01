import type { ScheduleContext } from "../rendering/schedule-context";

export function getOrCreateDriver(path: string, defaultValue: number, context: ScheduleContext): ConstantSourceNode {
	const existing = context.driverMap.get(path);

	if (existing) return existing;

	const driver = context.audioContext.createConstantSource();

	driver.offset.value = defaultValue;
	driver.start(0);
	context.driverMap.set(path, driver);

	return driver;
}

export function driveParam(param: AudioParam, path: string | undefined, value: number, range: readonly [number, number], context: ScheduleContext): void {
	if (path) {
		const [min, max] = range;
		const normalized = (value - min) / (max - min);
		const driver = getOrCreateDriver(path, normalized, context);

		const scaleGain = context.audioContext.createGain();

		scaleGain.gain.value = max - min;
		param.value = min;

		driver.connect(scaleGain);
		scaleGain.connect(param);
	} else {
		param.value = value;
	}
}

export function offsetParam(param: AudioParam, path: string | undefined, value: number, range: readonly [number, number], context: ScheduleContext): void {
	param.value = value;

	if (path) {
		const [min, max] = range;
		const driver = getOrCreateDriver(path, 0, context);

		const scaleGain = context.audioContext.createGain();

		scaleGain.gain.value = max - min;

		driver.connect(scaleGain);
		scaleGain.connect(param);
	}
}

export function undriveParam(path: string, param: AudioParam, context: ScheduleContext): void {
	try {
		context.driverMap.get(path)?.disconnect(param);
	} catch {
		// already disconnected (e.g. teardown ran before oscillator "ended" event)
	}
}

export function proxyDriver(id: string | undefined, key: string, childPath: string, context: ScheduleContext): void {
	if (!id) return;

	const childDriver = context.driverMap.get(childPath);

	if (!childDriver) return;

	const parentDriver = getOrCreateDriver(`${id}.${key}`, childDriver.offset.value, context);

	childDriver.offset.value = 0;

	parentDriver.connect(childDriver.offset);
}

