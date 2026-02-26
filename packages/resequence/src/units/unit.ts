import type { ScheduleContext } from "../rendering/schedule-context";

export abstract class Unit {
	abstract readonly id?: string;

	readonly targets: Array<Unit> = [];

	readonly entryNodes: Array<AudioNode> = [];
	readonly exitNodes: Array<AudioNode> = [];

	readonly sampleKeys = new Set<string>();
	protected isSetUp = false;

	to(unit: Unit): Unit {
		this.targets.push(unit);

		return unit;
	}

	collectSampleKeys(): Set<string> {
		const keys = new Set(this.sampleKeys);

		for (const target of this.targets) {
			for (const key of target.collectSampleKeys()) keys.add(key);
		}

		return keys;
	}

	setup(context: ScheduleContext): void {
		if (this.isSetUp) return;
		this.isSetUp = true;

		this._setup(context);

		for (const target of this.targets) target.setup(context);

		this.link();
	}

	teardown(context: ScheduleContext): void {
		if (!this.isSetUp) return;
		this.isSetUp = false;

		this.unlink();

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
}
