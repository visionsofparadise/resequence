export interface DriverEntry {
	readonly node: ConstantSourceNode;
	readonly range?: readonly [number, number];
}

export interface UnitContext {
	readonly audioContext: BaseAudioContext;
	readonly driverMap: Map<string, DriverEntry>;
	readonly getSample: (path: string) => Promise<AudioBuffer>;
	readonly loadModule: (url: string) => Promise<void>;
	readonly latencyBudget: number;
	readonly basePath: string;
}

export function createUnitContext(
	audioContext: BaseAudioContext,
	getSample: (path: string) => Promise<AudioBuffer>,
	loadModule: (url: string) => Promise<void>,
	latencyBudget = 0,
	basePath = ".",
): UnitContext {
	return {
		audioContext,
		driverMap: new Map(),
		getSample,
		loadModule,
		latencyBudget,
		basePath,
	};
}
