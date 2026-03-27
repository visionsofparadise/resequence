import type { SetupResult, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";
import { channelMerger } from "./channel-merger";
import { channelSplitter } from "./channel-splitter";
import { linearGain } from "./gain";

export interface ChannelProperties extends UnitProperties {
	readonly channelIndex: number;
	readonly inner: Unit;
	readonly previousProperties?: ChannelProperties;
}

export class ChannelEffectUnit extends Unit {
	readonly type = ["unit", "channel"] as const;

	static override is(value: unknown): value is ChannelEffectUnit {
		return Unit.is(value) && value.type[1] === "channel";
	}

	declare readonly properties: ChannelProperties;

	constructor(properties: UnitInput<ChannelProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get channelIndex(): number { return this.properties.channelIndex; }
	get inner(): Unit { return this.properties.inner; }

	clone(overrides?: Partial<ChannelProperties>): ChannelEffectUnit {
		return new ChannelEffectUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const split = channelSplitter(2);
		const merge = channelMerger(2);

		const targetCh = this.channelIndex;
		const otherCh = targetCh === 0 ? 1 : 0;

		const splitTarget = split.channels[targetCh];
		const splitOther = split.channels[otherCh];
		const mergeTarget = merge.channels[targetCh];
		const mergeOther = merge.channels[otherCh];

		if (!splitTarget || !splitOther || !mergeTarget || !mergeOther) return {};

		splitTarget.to(this.inner);
		this.inner.to(mergeTarget);
		splitOther.to(mergeOther);

		await split.setup(context);
		await merge.setup(context);

		return { entries: [split], exits: [merge] };
	}
}

export function left(inner: Unit): ChannelEffectUnit {
	return new ChannelEffectUnit({ channelIndex: 0, inner });
}

export function right(inner: Unit): ChannelEffectUnit {
	return new ChannelEffectUnit({ channelIndex: 1, inner });
}

export interface MidProperties extends UnitProperties {
	readonly inner: Unit;
	readonly previousProperties?: MidProperties;
}

export class MidEffectUnit extends Unit {
	readonly type = ["unit", "mid"] as const;

	static override is(value: unknown): value is MidEffectUnit {
		return Unit.is(value) && value.type[1] === "mid";
	}

	declare readonly properties: MidProperties;

	constructor(properties: UnitInput<MidProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get inner(): Unit { return this.properties.inner; }

	clone(overrides?: Partial<MidProperties>): MidEffectUnit {
		return new MidEffectUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const split = channelSplitter(2);
		const merge = channelMerger(2);
		const sum = linearGain({ level: 0.5 });

		const splitL = split.channels[0];
		const splitR = split.channels[1];
		const mergeL = merge.channels[0];
		const mergeR = merge.channels[1];

		if (!splitL || !splitR || !mergeL || !mergeR) return {};

		splitL.to(sum);
		splitR.to(sum);
		sum.to(this.inner);
		this.inner.to(mergeL);
		this.inner.to(mergeR);

		await split.setup(context);
		await merge.setup(context);

		return { entries: [split], exits: [merge] };
	}
}

export function mid(inner: Unit): MidEffectUnit {
	return new MidEffectUnit({ inner });
}

export interface SideProperties extends UnitProperties {
	readonly inner: Unit;
	readonly previousProperties?: SideProperties;
}

export class SideEffectUnit extends Unit {
	readonly type = ["unit", "side"] as const;

	static override is(value: unknown): value is SideEffectUnit {
		return Unit.is(value) && value.type[1] === "side";
	}

	declare readonly properties: SideProperties;

	constructor(properties: UnitInput<SideProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get inner(): Unit { return this.properties.inner; }

	clone(overrides?: Partial<SideProperties>): SideEffectUnit {
		return new SideEffectUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const split = channelSplitter(2);
		const merge = channelMerger(2);
		const diff = linearGain({ level: 0.5 });
		const invert = linearGain({ level: -1 });
		const reinvert = linearGain({ level: -1 });

		const splitL = split.channels[0];
		const splitR = split.channels[1];
		const mergeL = merge.channels[0];
		const mergeR = merge.channels[1];

		if (!splitL || !splitR || !mergeL || !mergeR) return {};

		splitL.to(diff);
		splitR.to(invert);
		invert.to(diff);
		diff.to(this.inner);
		this.inner.to(mergeL);
		this.inner.to(reinvert);
		reinvert.to(mergeR);

		await split.setup(context);
		await merge.setup(context);

		return { entries: [split], exits: [merge] };
	}
}

export function side(inner: Unit): SideEffectUnit {
	return new SideEffectUnit({ inner });
}
