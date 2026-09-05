import { Unit } from "@resequence/web-au-core";
import { channelCountSchema, channelGainsOf, setupChannels } from "./utils/channelGains";
import type { GainEffectUnit } from "./gain";
import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import type { z } from "zod";

export class ChannelMergerUnit extends Unit<typeof channelCountSchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "channel-merger";
	readonly channels: Array<GainEffectUnit>;

	constructor(input: z.infer<typeof channelCountSchema> & UnitInput = { channelCount: 2 }) {
		super(input, channelCountSchema);
		this.channels = channelGainsOf(this.parameters.channelCount.value);
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const merger = context.audioContext.createChannelMerger(this.channels.length);

		await setupChannels(this.channels, context);

		for (const [channelIndex, channel] of this.channels.entries()) {
			for (const exit of channel.exitNodes) {
				exit.connect(merger, 0, channelIndex);
			}
		}

		return { entries: [...this.channels], exits: [merger] };
	}

	protected override _teardown(context: UnitContext): void {
		for (const channel of this.channels) channel.teardown(context);
	}
}

export function channelMerger(channels?: number): ChannelMergerUnit {
	return new ChannelMergerUnit({ channelCount: channels ?? 2 });
}

export function merge(channels?: number): ChannelMergerUnit {
	return channelMerger(channels);
}
