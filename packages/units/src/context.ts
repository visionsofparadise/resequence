export interface DriverEntry {
	readonly node: ConstantSourceNode;
	readonly range?: readonly [number, number];
}

export interface UnitContext {
	readonly audioContext: BaseAudioContext;
	readonly driverMap: Map<string, DriverEntry>;
	readonly getSample: (path: string) => Promise<AudioBuffer>;
	readonly loadModule: (url: string) => Promise<void>;
}

export function createUnitContext(audioContext: BaseAudioContext, getSample: (path: string) => Promise<AudioBuffer>, loadModule: (url: string) => Promise<void>): UnitContext {
	return {
		audioContext,
		driverMap: new Map(),
		getSample,
		loadModule,
	};
}
