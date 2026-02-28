import type { ScheduleContext } from "../rendering/schedule-context";
import { getOrCreateDriver } from "../utils/driver";
import { buildCurve } from "./utils/build-curve";

export interface ModDeclaration {
	readonly paths: ReadonlyArray<string>;
	readonly transform?: (value: number) => number;
}

export abstract class Unit {
	abstract readonly id?: string;
	protected abstract readonly innerUnits: ReadonlyArray<Unit>;

	readonly targets: Array<Unit> = [];

	readonly entryNodes: Array<AudioNode> = [];
	readonly exitNodes: Array<AudioNode> = [];

	readonly sampleKeys = new Set<string>();
	protected isSetUp = false;

	private readonly modDeclarations: Array<ModDeclaration> = [];
	private readonly modConnections: Array<{ exit: AudioNode; shaper?: AudioNode; param: AudioParam }> = [];

	to(unit: Unit): void {
		this.targets.push(unit);
	}

	mod(paths: Array<string>, transform?: (value: number) => number): void {
		this.modDeclarations.push({ paths, transform });
	}

	collectSampleKeys(): Set<string> {
		const keys = new Set(this.sampleKeys);

		for (const unit of [...this.targets, ...this.innerUnits]) {
			for (const key of unit.collectSampleKeys()) keys.add(key);
		}

		return keys;
	}

	collectModuleUrls(): Set<string> {
		const urls = new Set<string>();

		for (const unit of [...this.targets, ...this.innerUnits]) {
			for (const url of unit.collectModuleUrls()) urls.add(url);
		}

		return urls;
	}

	setup(context: ScheduleContext): void {
		if (this.isSetUp) return;
		this.isSetUp = true;

		this._setup(context);

		for (const target of this.targets) target.setup(context);

		this.link();
		this.linkMods(context);
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

	protected abstract _setup(context: ScheduleContext): void;

	protected abstract _teardown(context: ScheduleContext): void;

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
		for (const decl of this.modDeclarations) {
			for (const path of decl.paths) {
				const driver = getOrCreateDriver(path, 0, context);

				if (decl.transform) {
					const shaper = context.audioContext.createWaveShaper();
					shaper.curve = buildCurve(decl.transform);
					shaper.connect(driver.offset);

					for (const exit of this.exitNodes) {
						exit.connect(shaper);
						this.modConnections.push({ exit, shaper, param: driver.offset });
					}
				} else {
					for (const exit of this.exitNodes) {
						exit.connect(driver.offset);
						this.modConnections.push({ exit, param: driver.offset });
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
