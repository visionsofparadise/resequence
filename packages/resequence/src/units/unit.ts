import type { ScheduleContext } from "../rendering/schedule-context";
import type { OptionalProperties } from "../utils/RequiredProperties";
import { getOrCreateDriver } from "../utils/driver";
import { buildCurve } from "./utils/build-curve";

export interface ModDeclaration {
	readonly paths: ReadonlyArray<string>;
	readonly transform?: (value: number) => number;
}

export interface UnitProperties {
	readonly id?: string;
	readonly targets: Array<Unit>;
	readonly modDeclarations: Array<ModDeclaration>;
}

export type UnitInput<P extends UnitProperties = UnitProperties> = OptionalProperties<P, "targets" | "modDeclarations">;

export interface SetupResult {
	entries?: Array<AudioNode | Unit>;
	exits?: Array<AudioNode | Unit>;
}

export abstract class Unit {
	abstract readonly type: ReadonlyArray<string>;
	readonly properties: UnitProperties;

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

	get targets(): Array<Unit> {
		return this.properties.targets;
	}

	abstract clone(overrides?: Partial<UnitProperties>): Unit;

	to(unit: Unit): void {
		this.properties.targets.push(unit);
	}

	mod(paths: ReadonlyArray<string>, transform?: (value: number) => number): void {
		this.properties.modDeclarations.push({ paths, transform });
	}

	setup(context: ScheduleContext): void | Promise<void> {
		if (this.isSetUp) return;
		this.isSetUp = true;

		const resultOrPromise = this._setup(context);

		if (resultOrPromise instanceof Promise) {
			return resultOrPromise.then((result) => this._finishSetup(result, context));
		}

		return this._finishSetup(resultOrPromise, context);
	}

	private _finishSetup(result: SetupResult, context: ScheduleContext): void | Promise<void> {
		const entries = result.entries ?? [];
		const exits = result.exits ?? [];

		const steps: Array<() => void | Promise<void>> = [];

		for (const entry of entries) {
			if (entry instanceof Unit) {
				const unit = entry;
				steps.push(() => unit.setup(context));
			}
		}

		steps.push(() => {
			for (const entry of entries) {
				if (entry instanceof Unit) this.entryNodes.push(...entry.entryNodes);
				else this.entryNodes.push(entry);
			}
			for (const exit of exits) {
				if (exit instanceof Unit) this.exitNodes.push(...exit.exitNodes);
				else this.exitNodes.push(exit);
			}
		});

		for (const target of this.targets) {
			steps.push(() => target.setup(context));
		}

		steps.push(() => {
			this.link();
			this.linkMods(context);
		});

		return runSequence(steps);
	}

	teardown(context: ScheduleContext): void {
		if (!this.isSetUp) return;
		this.isSetUp = false;

		this.unlink();
		this.unlinkMods();

		this._teardown(context);

		this.entryNodes.length = 0;
		this.exitNodes.length = 0;

		for (const target of this.targets) target.teardown(context);
	}

	protected _setup(_context: ScheduleContext): SetupResult | Promise<SetupResult> {
		return {};
	}

	protected _teardown(_context: ScheduleContext): void {
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

	private linkMods(context: ScheduleContext): void {
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

function runSequence(steps: Array<() => void | Promise<void>>): void | Promise<void> {
	for (let index = 0; index < steps.length; index++) {
		const result = steps[index]?.();
		if (result instanceof Promise) {
			let chain = result;
			for (let next = index + 1; next < steps.length; next++) {
				const step = steps[next];
				if (step) chain = chain.then(step);
			}
			return chain;
		}
	}
}
