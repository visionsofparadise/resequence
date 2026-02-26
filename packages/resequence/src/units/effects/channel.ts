import type { ScheduleContext } from "../../rendering/schedule-context";
import { Unit } from "../unit";

export class ChannelEffectUnit extends Unit {
	readonly type = "channel" as const;
	readonly id = undefined;

	public readonly channelIndex: number;
	public readonly inner: Unit;
	protected readonly innerUnits: ReadonlyArray<Unit>;

	constructor(channelIndex: number, inner: Unit) {
		super();
		this.channelIndex = channelIndex;
		this.inner = inner;
		this.innerUnits = [inner];
	}

	protected _setup(context: ScheduleContext): void {
		const splitterNode = context.audioContext.createChannelSplitter(2);
		const mergerNode = context.audioContext.createChannelMerger(2);

		this.inner.setup(context);

		const otherChannel = this.channelIndex === 0 ? 1 : 0;
		const innerEntry = this.inner.entryNodes[0];
		if (innerEntry) {
			splitterNode.connect(innerEntry, this.channelIndex);
		}

		for (const exit of this.inner.exitNodes) {
			exit.connect(mergerNode, 0, this.channelIndex);
		}

		splitterNode.connect(mergerNode, otherChannel, otherChannel);

		this.entryNodes.push(splitterNode);
		this.exitNodes.push(mergerNode);
	}

	protected _teardown(context: ScheduleContext): void {
		this.inner.teardown(context);
	}
}

export function left(inner: Unit): ChannelEffectUnit {
	return new ChannelEffectUnit(0, inner);
}

export function right(inner: Unit): ChannelEffectUnit {
	return new ChannelEffectUnit(1, inner);
}

export class MidEffectUnit extends Unit {
	readonly type = "mid" as const;
	readonly id = undefined;

	public readonly inner: Unit;
	protected readonly innerUnits: ReadonlyArray<Unit>;

	constructor(inner: Unit) {
		super();
		this.inner = inner;
		this.innerUnits = [inner];
	}

	protected _setup(context: ScheduleContext): void {
		const splitterNode = context.audioContext.createChannelSplitter(2);
		const mergerNode = context.audioContext.createChannelMerger(2);

		const sumGain = context.audioContext.createGain();
		sumGain.gain.value = 0.5;

		splitterNode.connect(sumGain, 0);
		splitterNode.connect(sumGain, 1);

		this.inner.setup(context);

		const innerEntry = this.inner.entryNodes[0];
		if (innerEntry) {
			sumGain.connect(innerEntry);
		}

		for (const exit of this.inner.exitNodes) {
			exit.connect(mergerNode, 0, 0);
			exit.connect(mergerNode, 0, 1);
		}

		this.entryNodes.push(splitterNode);
		this.exitNodes.push(mergerNode);
	}

	protected _teardown(context: ScheduleContext): void {
		this.inner.teardown(context);
	}
}

export function mid(inner: Unit): MidEffectUnit {
	return new MidEffectUnit(inner);
}

export class SideEffectUnit extends Unit {
	readonly type = "side" as const;
	readonly id = undefined;

	public readonly inner: Unit;
	protected readonly innerUnits: ReadonlyArray<Unit>;

	constructor(inner: Unit) {
		super();
		this.inner = inner;
		this.innerUnits = [inner];
	}

	protected _setup(context: ScheduleContext): void {
		const splitterNode = context.audioContext.createChannelSplitter(2);
		const mergerNode = context.audioContext.createChannelMerger(2);

		const diffGain = context.audioContext.createGain();
		diffGain.gain.value = 0.5;

		const invertGain = context.audioContext.createGain();
		invertGain.gain.value = -1;

		splitterNode.connect(diffGain, 0);
		splitterNode.connect(invertGain, 1);
		invertGain.connect(diffGain);

		this.inner.setup(context);

		const innerEntry = this.inner.entryNodes[0];
		if (innerEntry) {
			diffGain.connect(innerEntry);
		}

		for (const exit of this.inner.exitNodes) {
			exit.connect(mergerNode, 0, 0);

			const reinvert = context.audioContext.createGain();
			reinvert.gain.value = -1;
			exit.connect(reinvert);
			reinvert.connect(mergerNode, 0, 1);
		}

		this.entryNodes.push(splitterNode);
		this.exitNodes.push(mergerNode);
	}

	protected _teardown(context: ScheduleContext): void {
		this.inner.teardown(context);
	}
}

export function side(inner: Unit): SideEffectUnit {
	return new SideEffectUnit(inner);
}
