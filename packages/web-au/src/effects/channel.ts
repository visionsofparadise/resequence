import { Unit } from "@resequence/web-au-core";
import { z } from "zod";
import { channelMerger } from "./channel-merger";
import { channelSplitter } from "./channel-splitter";
import { linearGain } from "./gain";
import type { SetupResult, UnitContext, UnitInput, AnyUnit } from "@resequence/web-au-core";

export class ChannelEffectUnit extends Unit {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "channel";

	readonly channelIndex: number;
	readonly inner: AnyUnit;

	constructor(input: UnitInput & { readonly channelIndex: number; readonly inner: AnyUnit }) {
		super(input, z.object({}));
		this.channelIndex = input.channelIndex;
		this.inner = input.inner;
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

export class MidEffectUnit extends Unit {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "mid";

	readonly inner: AnyUnit;

	constructor(input: UnitInput & { readonly inner: AnyUnit }) {
		super(input, z.object({}));
		this.inner = input.inner;
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

export class SideEffectUnit extends Unit {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "side";

	readonly inner: AnyUnit;

	constructor(input: UnitInput & { readonly inner: AnyUnit }) {
		super(input, z.object({}));
		this.inner = input.inner;
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
