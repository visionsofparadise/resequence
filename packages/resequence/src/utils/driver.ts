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

export function driveParam(param: AudioParam, id: string | undefined, key: string, value: number, context: ScheduleContext): void {
	if (id) {
		const driver = getOrCreateDriver(`${id}.${key}`, value, context);
		param.value = 0;
		driver.connect(param);
	} else {
		param.value = value;
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
