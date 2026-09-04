import { Unit } from "@resequence/web-au-core";
import { z } from "zod";
import { type GainEffectUnit, linearGain } from "./gain";
import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";

const channelSplitterSchema = z.object({
	channelCount: z.number().min(1).max(32).default(2).describe("Channel Count"),
});

export class ChannelSplitterUnit extends Unit<typeof channelSplitterSchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "channel-splitter";
	readonly channels: Array<GainEffectUnit> = [];

	constructor(input: z.infer<typeof channelSplitterSchema> & UnitInput = { channelCount: 2 }) {
		super(input, channelSplitterSchema);

		for (let channelIndex = 0; channelIndex < this.parameters.channelCount.value; channelIndex++) {
			this.channels.push(linearGain({ level: 1 }));
		}
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const splitter = context.audioContext.createChannelSplitter(this.channels.length);

		for (let channelIndex = 0; channelIndex < this.channels.length; channelIndex++) {
			const channel = this.channels[channelIndex];

			if (!channel) continue;

			await channel.setup(context);

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
