type OptionalProperties<D extends object, K extends keyof D> = Omit<D, K> & Partial<Pick<D, K>>;

export interface AudioChunk {
	readonly samples: Array<Float32Array>;
	readonly offset: number;
	readonly duration: number;
}

export interface StreamContext {
	readonly sampleRate: number;
	readonly channels: number;
	readonly duration?: number;
}

export interface RenderOptions {
	readonly chunkSize?: number;
	readonly highWaterMark?: number;
}

export interface AsyncUnitProperties {
	readonly id?: string;
	readonly targets: Array<AsyncUnit>;
	readonly previousProperties?: AsyncUnitProperties;
}

export type AsyncUnitInput<P extends AsyncUnitProperties = AsyncUnitProperties> = OptionalProperties<P, "targets">;

export abstract class AsyncUnit {
	abstract readonly type: ReadonlyArray<string>;

	readonly properties: AsyncUnitProperties;

	static is(value: unknown): value is AsyncUnit {
		return typeof value === "object" && value !== null && "type" in value && Array.isArray(value.type) && value.type[0] === "async-unit";
	}

	constructor(properties?: AsyncUnitInput) {
		this.properties = {
			...properties,
			targets: properties?.targets ?? [],
		};
	}

	get id(): string | undefined {
		return this.properties.id;
	}

	get targets(): Array<AsyncUnit> {
		return this.properties.targets;
	}

	abstract get bufferSize(): number;
	abstract get latency(): number;

	abstract clone(overrides?: Partial<AsyncUnitProperties>): AsyncUnit;

	to(target: AsyncUnit): void {
		this.properties.targets.push(target);
	}

	async setup(context: StreamContext): Promise<void> {
		await Promise.all([this._setup(context), ...this.targets.map((target) => target.setup(context))]);
	}

	protected _setup(_context: StreamContext): Promise<void> | void {
		return;
	}

	async teardown(): Promise<void> {
		await Promise.all(this.targets.map((target) => target.teardown()));

		await this._teardown();
	}

	protected _teardown(): Promise<void> | void {
		return;
	}
}
