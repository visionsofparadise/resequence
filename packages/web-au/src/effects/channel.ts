import { Unit } from "@resequence/web-au-core";
import { z } from "zod";
import { channelMerger } from "./channel-merger";
import { channelSplitter } from "./channel-splitter";
import { linearGain } from "./gain";
import type { ChannelMergerUnit } from "./channel-merger";
import type { ChannelSplitterUnit } from "./channel-splitter";
import type { GainEffectUnit } from "./gain";
import type { SetupResult, UnitContext, UnitInput, AnyUnit } from "@resequence/web-au-core";

interface StereoBridge {
	readonly split: ChannelSplitterUnit;
	readonly merge: ChannelMergerUnit;
	readonly splitLeft: GainEffectUnit;
	readonly splitRight: GainEffectUnit;
	readonly mergeLeft: GainEffectUnit;
	readonly mergeRight: GainEffectUnit;
}

function createStereoBridge(): StereoBridge | undefined {
	const split = channelSplitter(2);
	const merge = channelMerger(2);

	const [splitLeft, splitRight] = split.channels;
	const [mergeLeft, mergeRight] = merge.channels;

	if (!splitLeft || !splitRight || !mergeLeft || !mergeRight) return undefined;

	return { split, merge, splitLeft, splitRight, mergeLeft, mergeRight };
}

async function setupStereoBridge(bridge: StereoBridge, context: UnitContext): Promise<SetupResult> {
	await bridge.split.setup(context);
	await bridge.merge.setup(context);

	return { entries: [bridge.split], exits: [bridge.merge] };
}

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
		const bridge = createStereoBridge();

		if (!bridge) return {};

		const isLeft = this.channelIndex === 0;
		const splitTarget = isLeft ? bridge.splitLeft : bridge.splitRight;
		const splitOther = isLeft ? bridge.splitRight : bridge.splitLeft;
		const mergeTarget = isLeft ? bridge.mergeLeft : bridge.mergeRight;
		const mergeOther = isLeft ? bridge.mergeRight : bridge.mergeLeft;

		splitTarget.to(this.inner);
		this.inner.to(mergeTarget);
		splitOther.to(mergeOther);

		return setupStereoBridge(bridge, context);
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
		const bridge = createStereoBridge();

		if (!bridge) return {};

		const sum = linearGain({ level: 0.5 });

		bridge.splitLeft.to(sum);
		bridge.splitRight.to(sum);
		sum.to(this.inner);
		this.inner.to(bridge.mergeLeft);
		this.inner.to(bridge.mergeRight);

		return setupStereoBridge(bridge, context);
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
		const bridge = createStereoBridge();

		if (!bridge) return {};

		const diff = linearGain({ level: 0.5 });
		const invert = linearGain({ level: -1 });
		const reinvert = linearGain({ level: -1 });

		bridge.splitLeft.to(diff);
		bridge.splitRight.to(invert);
		invert.to(diff);
		diff.to(this.inner);
		this.inner.to(bridge.mergeLeft);
		this.inner.to(reinvert);
		reinvert.to(bridge.mergeRight);

		return setupStereoBridge(bridge, context);
	}
}

export function side(inner: Unit): SideEffectUnit {
	return new SideEffectUnit({ inner });
}
