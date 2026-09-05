import { buildCurve } from "./build-curve";
import { getOrCreateDriver } from "./driver";
import { clearLiveParameters, createParameters } from "./parameter";
import type { UnitContext } from "./context";
import type { InferParameters } from "./schema";
import type { z } from "zod";

export interface ModDeclaration {
	readonly paths: ReadonlyArray<string>;
	readonly transform?: (value: number) => number;
}

export interface UnitInput {
	id?: string;
}

export interface SetupResult {
	entries?: Array<AudioNode | AnyUnit>;
	exits?: Array<AudioNode | AnyUnit>;
}

export type AnyUnit = Unit;

export abstract class Unit<S extends z.ZodObject = z.ZodObject> {
	abstract readonly type: ReadonlyArray<string>;
	abstract readonly packageName: string;
	abstract readonly unitName: string;

	readonly id: string | undefined;
	readonly schema: S;
	latency = 0;
	duration = 0;
	readonly targets: Array<AnyUnit> = [];
	readonly modDeclarations: Array<ModDeclaration> = [];
	readonly parameters: InferParameters<S>;

	static is(value: unknown): value is AnyUnit {
		return (
			typeof value === "object" &&
			value !== null &&
			"type" in value &&
			Array.isArray(value.type) &&
			value.type[0] === "unit"
		);
	}

	readonly entryNodes: Array<AudioNode> = [];
	readonly exitNodes: Array<AudioNode> = [];

	protected isSetUp = false;

	private readonly modConnections: Array<{ exit: AudioNode; shaper?: AudioNode; param: AudioParam }> = [];

	constructor(input: UnitInput, schema: S) {
		this.id = input.id;
		this.schema = schema;
		this.parameters = createParameters(input, schema);
	}

	to(unit: AnyUnit): void {
		this.targets.push(unit);
	}

	mod(paths: ReadonlyArray<string>, transform?: (value: number) => number): void {
		this.modDeclarations.push({ paths, transform });
	}

	async setup(context: UnitContext): Promise<void> {
		if (this.isSetUp) return;

		this.isSetUp = true;

		const result = await this._setup(context);
		const entries = result.entries ?? [];
		const exits = result.exits ?? [];

		for (const entry of entries) {
			if (Unit.is(entry)) {
				await entry.setup(context);

				this.entryNodes.push(...entry.entryNodes);
			} else {
				this.entryNodes.push(entry);
			}
		}

		for (const exit of exits) {
			if (Unit.is(exit)) {
				await exit.setup(context);

				this.exitNodes.push(...exit.exitNodes);
			} else {
				this.exitNodes.push(exit);
			}
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
		clearLiveParameters(this.parameters);

		this.entryNodes.length = 0;
		this.exitNodes.length = 0;

		for (const target of this.targets) target.teardown(context);
	}

	protected _setup(_context: UnitContext): SetupResult | Promise<SetupResult> {
		return {};
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
					} catch {}
				}
			}
		}
	}

	private linkMods(context: UnitContext): void {
		for (const decl of this.modDeclarations) {
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
			} catch {}
		}

		this.modConnections.length = 0;
	}
}
