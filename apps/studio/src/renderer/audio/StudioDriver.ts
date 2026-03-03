import type { ValueScheduler } from "./ValueScheduler";

export class StudioDriver {
	private _mirrorValue: number;
	private readonly _listeners = new Set<(value: number) => void>();
	readonly offset: StudioDriverOffset;

	constructor(
		private readonly _real: ConstantSourceNode,
		readonly range: readonly [number, number] | undefined,
		readonly scheduler: ValueScheduler,
	) {
		this._mirrorValue = _real.offset.value;
		this.offset = new StudioDriverOffset(this);
	}

	get realNode(): ConstantSourceNode {
		return this._real;
	}

	get mirrorValue(): number {
		return this._mirrorValue;
	}

	mirror(value: number): void {
		this._mirrorValue = value;

		for (const listener of this._listeners) listener(value);
	}

	subscribe(listener: (value: number) => void): () => void {
		this._listeners.add(listener);

		listener(this._mirrorValue);

		return () => this._listeners.delete(listener);
	}

	connect(destination: AudioNode | AudioParam, ...args: Array<number>): void {
		if (destination instanceof StudioDriverOffset) {
			this._real.connect(destination.realParam, ...args);
		} else {
			this._real.connect(destination as AudioNode, ...args);
		}
	}

	disconnect(...args: Array<unknown>): void {
		if (args.length === 0) {
			this._real.disconnect();
		} else if (args[0] instanceof StudioDriverOffset) {
			this._real.disconnect(args[0].realParam);
		} else {
			this._real.disconnect(args[0] as AudioNode);
		}
	}

	start(when?: number): void {
		this._real.start(when);
	}

	stop(when?: number): void {
		this._real.stop(when);
	}
}

export class StudioDriverOffset {
	constructor(private readonly _driver: StudioDriver) {}

	get value(): number {
		return this._driver.realNode.offset.value;
	}

	set value(newValue: number) {
		this._driver.realNode.offset.value = newValue;
		this._driver.mirror(newValue);
	}

	get realParam(): AudioParam {
		return this._driver.realNode.offset;
	}

	setValueAtTime(value: number, startTime: number): AudioParam {
		this._driver.scheduler.schedule(this._driver, "setValueAtTime", value, startTime);
		return this._driver.realNode.offset.setValueAtTime(value, startTime);
	}

	linearRampToValueAtTime(value: number, endTime: number): AudioParam {
		this._driver.scheduler.schedule(this._driver, "linearRamp", value, endTime);
		return this._driver.realNode.offset.linearRampToValueAtTime(value, endTime);
	}

	exponentialRampToValueAtTime(value: number, endTime: number): AudioParam {
		this._driver.scheduler.schedule(this._driver, "exponentialRamp", value, endTime);
		return this._driver.realNode.offset.exponentialRampToValueAtTime(value, endTime);
	}

	cancelScheduledValues(startTime: number): AudioParam {
		this._driver.scheduler.cancel(this._driver, startTime);
		return this._driver.realNode.offset.cancelScheduledValues(startTime);
	}
}
