import { Unit } from "@resequence/web-au-core";
import { channelCountSchema, channelGainsOf, setupChannels } from "./utils/channelGains";
import type { GainEffectUnit } from "./gain";
import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import type { z } from "zod";

export class ChannelSplitterUnit extends Unit<typeof channelCountSchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "channel-splitter";
	readonly channels: Array<GainEffectUnit>;

	constructor(input: z.infer<typeof channelCountSchema> & UnitInput = { channelCount: 2 }) {
		super(input, channelCountSchema);
		this.channels = channelGainsOf(this.parameters.channelCount.value);
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const splitter = context.audioContext.createChannelSplitter(this.channels.length);

		await setupChannels(this.channels, context);

		for (const [channelIndex, channel] of this.channels.entries()) {
			const entry = channel.entryNodes[0];

			if (entry) splitter.connect(entry, channelIndex);
		}

		return { entries: [splitter], exits: [...this.channels] };
	}

	protected override _teardown(context: UnitContext): void {
		for (const channel of this.channels) channel.teardown(context);
	}
}

export function channelSplitter(channels?: number): ChannelSplitterUnit {
	return new ChannelSplitterUnit({ channelCount: channels ?? 2 });
}

export function split(channels?: number): ChannelSplitterUnit {
	return channelSplitter(channels);
}
