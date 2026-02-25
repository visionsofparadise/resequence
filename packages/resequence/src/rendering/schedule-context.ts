import type { TempoMap } from "./tempo-map";

export interface ScheduleContext {
	readonly audioContext: BaseAudioContext;
	readonly sampleMap: ReadonlyMap<string, AudioBuffer>;
	readonly nodeMap: Map<string, AudioNode>;
	readonly driverMap: Map<string, ConstantSourceNode>;
	readonly tempoMap: TempoMap;
	readonly fromTicks: number;
	readonly toTicks: number;
	readonly trackFilter?: ReadonlySet<string>;
}

export function getOrCreateDriver(path: string, defaultValue: number, context: ScheduleContext): ConstantSourceNode {
	const existing = context.driverMap.get(path);

	if (existing) return existing;

	const driver = context.audioContext.createConstantSource();

	driver.offset.value = defaultValue;
	driver.start(0);
	context.driverMap.set(path, driver);

	return driver;
}
