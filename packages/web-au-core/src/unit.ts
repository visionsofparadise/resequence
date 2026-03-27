import type { UnitContext } from "./context";
import { buildCurve } from "./build-curve";
import { getOrCreateDriver } from "./driver";

type OptionalProperties<D extends object, K extends keyof D> = Omit<D, K> & Partial<Pick<D, K>>;

export interface ModDeclaration {
	readonly paths: ReadonlyArray<string>;
	readonly transform?: (value: number) => number;
}

export interface UnitProperties {
	readonly id?: string;
	readonly latency?: number;
	readonly targets: Array<Unit>;
	readonly modDeclarations: Array<ModDeclaration>;
	readonly previousProperties?: UnitProperties;
}

export type UnitInput<P extends UnitProperties = UnitProperties> = OptionalProperties<P, "targets" | "modDeclarations">;

export interface SetupResult {
	entries?: Array<AudioNode | Unit>;
	exits?: Array<AudioNode | Unit>;
}

export abstract class Unit {
	abstract readonly type: ReadonlyArray<string>;
	declare properties: UnitProperties;

	static is(value: unknown): value is Unit {
		return typeof value === "object" && value !== null && "type" in value && Array.isArray(value.type) && value.type[0] === "unit";
	}

	readonly entryNodes: Array<AudioNode> = [];
	readonly exitNodes: Array<AudioNode> = [];

	protected isSetUp = false;

	private readonly modConnections: Array<{ exit: AudioNode; shaper?: AudioNode; param: AudioParam }> = [];

	constructor(properties?: UnitInput) {
		this.properties = {
			...properties,
			targets: properties?.targets ?? [],
			modDeclarations: properties?.modDeclarations ?? [],
		};
	}

	get id(): string | undefined {
		return this.properties.id;
	}

	get latency(): number {
		return this.properties.latency ?? 0;
	}

	// eslint-disable-next-line @typescript-eslint/class-literal-property-style
	get duration(): number {
		return 0;
	}

	get targets(): Array<Unit> {
		return this.properties.targets;
	}

	abstract clone(overrides?: Partial<UnitProperties>): Unit;

	to(unit: Unit): void {
		this.properties = { ...this.properties, targets: [...this.properties.targets, unit] };
	}

	mod(paths: ReadonlyArray<string>, transform?: (value: number) => number): void {
		this.properties = { ...this.properties, modDeclarations: [...this.properties.modDeclarations, { paths, transform }] };
	}

	async play(context: UnitContext): Promise<void> {
		await this._play(context);

		for (const target of this.targets) {
			await target.play(context);
		}
	}

	async setup(context: UnitContext): Promise<void> {
		if (this.isSetUp) return;
		this.isSetUp = true;

		const result = await this._setup(context);
		const entries = result.entries ?? [];
		const exits = result.exits ?? [];

		for (const entry of entries) {
			if (entry instanceof Unit) await entry.setup(context);
		}

		for (const entry of entries) {
			if (entry instanceof Unit) this.entryNodes.push(...entry.entryNodes);
			else this.entryNodes.push(entry);
		}

		for (const exit of exits) {
			if (exit instanceof Unit) this.exitNodes.push(...exit.exitNodes);
			else this.exitNodes.push(exit);
		}

		for (const target of this.targets) {
			await target.setup(context);
		}

		this.link();
		this.linkMods(context);
	}

	teardown(context: UnitContext): void {
		if (!this.isSetUp) return;
		this.isSetUp = false;

		this.unlink();
		this.unlinkMods();

		this._teardown(context);

		this.entryNodes.length = 0;
		this.exitNodes.length = 0;

		for (const target of this.targets) target.teardown(context);
	}

	protected _setup(_context: UnitContext): SetupResult | Promise<SetupResult> {
		return {};
	}

	protected _play(_context: UnitContext): void | Promise<void> {
		return;
	}

	protected _teardown(_context: UnitContext): void {
		return;
	}

	link(): void {
		for (const exit of this.exitNodes) {
			for (const target of this.targets) {
				for (const entry of target.entryNodes) {
					exit.connect(entry);
				}
			}
		}
	}

	unlink(): void {
		for (const exit of this.exitNodes) {
			for (const target of this.targets) {
				for (const entry of target.entryNodes) {
					try {
						exit.disconnect(entry);
					} catch {
						// already disconnected
					}
				}
			}
		}
	}

	private linkMods(context: UnitContext): void {
		for (const decl of this.properties.modDeclarations) {
			for (const path of decl.paths) {
				const entry = getOrCreateDriver(path, 0, context);

				if (decl.transform) {
					const shaper = context.audioContext.createWaveShaper();

					shaper.curve = buildCurve(decl.transform);
					shaper.connect(entry.node.offset);

					for (const exit of this.exitNodes) {
						exit.connect(shaper);
						this.modConnections.push({ exit, shaper, param: entry.node.offset });
					}
				} else {
					for (const exit of this.exitNodes) {
						exit.connect(entry.node.offset);
						this.modConnections.push({ exit, param: entry.node.offset });
					}
				}
			}
		}
	}

	private unlinkMods(): void {
		for (const { exit, shaper, param } of this.modConnections) {
			try {
				if (shaper) {
					exit.disconnect(shaper);
					shaper.disconnect(param);
				} else {
					exit.disconnect(param);
				}
			} catch {
				// already disconnected
			}
		}

		this.modConnections.length = 0;
	}
}
