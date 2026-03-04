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

	// AudioNode pass-throughs
	get channelCount(): number { return this._real.channelCount; }
	set channelCount(value: number) { this._real.channelCount = value; }
	get channelCountMode(): ChannelCountMode { return this._real.channelCountMode; }
	set channelCountMode(value: ChannelCountMode) { this._real.channelCountMode = value; }
	get channelInterpretation(): ChannelInterpretation { return this._real.channelInterpretation; }
	set channelInterpretation(value: ChannelInterpretation) { this._real.channelInterpretation = value; }
	get context(): BaseAudioContext { return this._real.context; }
	get numberOfInputs(): number { return this._real.numberOfInputs; }
	get numberOfOutputs(): number { return this._real.numberOfOutputs; }

	// AudioScheduledSourceNode pass-throughs
	get onended(): ((this: AudioScheduledSourceNode, ev: Event) => unknown) | null { return this._real.onended; }
	set onended(value: ((this: AudioScheduledSourceNode, ev: Event) => unknown) | null) { this._real.onended = value; }

	// EventTarget pass-throughs
	addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void {
		this._real.addEventListener(type, listener, options);
	}

	removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void {
		this._real.removeEventListener(type, listener, options);
	}

	dispatchEvent(event: Event): boolean {
		return this._real.dispatchEvent(event);
	}

	connect(destinationNode: AudioNode, output?: number, input?: number): AudioNode;
	connect(destinationParam: AudioParam, output?: number): void;
	connect(destination: AudioNode | AudioParam, output?: number, input?: number): AudioNode | void {
		if (destination instanceof StudioDriverOffset) {
			this._real.connect(destination.realParam, output);
			return undefined;
		}
		if (destination instanceof AudioParam) {
			this._real.connect(destination, output);
			return undefined;
		}
		return this._real.connect(destination, output, input);
	}

	disconnect(...args: Array<unknown>): void {
		if (args.length === 0) {
			this._real.disconnect();
		} else if (args[0] instanceof StudioDriverOffset) {
			this._real.disconnect(args[0].realParam);
		} else if (typeof args[0] === "number") {
			this._real.disconnect(args[0]);
		} else if (args[0] instanceof AudioParam) {
			this._real.disconnect(args[0], args[1] as number);
		} else {
			this._real.disconnect(args[0] as AudioNode, args[1] as number, args[2] as number);
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

	// AudioParam pass-throughs
	get defaultValue(): number { return this._driver.realNode.offset.defaultValue; }
	get minValue(): number { return this._driver.realNode.offset.minValue; }
	get maxValue(): number { return this._driver.realNode.offset.maxValue; }
	get automationRate(): AutomationRate { return this._driver.realNode.offset.automationRate; }
	set automationRate(value: AutomationRate) { this._driver.realNode.offset.automationRate = value; }

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

	setTargetAtTime(target: number, startTime: number, timeConstant: number): AudioParam {
		return this._driver.realNode.offset.setTargetAtTime(target, startTime, timeConstant);
	}

	setValueCurveAtTime(values: Array<number> | Float32Array, startTime: number, duration: number): AudioParam {
		return this._driver.realNode.offset.setValueCurveAtTime(values, startTime, duration);
	}

	cancelScheduledValues(startTime: number): AudioParam {
		this._driver.scheduler.cancel(this._driver, startTime);
		return this._driver.realNode.offset.cancelScheduledValues(startTime);
	}

	cancelAndHoldAtTime(cancelTime: number): AudioParam {
		return this._driver.realNode.offset.cancelAndHoldAtTime(cancelTime);
	}
}
