import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";
import { z } from "zod";
import { type GainEffectUnit, linearGain } from "./gain";

const channelSplitterSchema = z.object({
	channelCount: z.number().min(1).max(32).default(2).describe("Channel Count"),
});

export class ChannelSplitterUnit extends Unit<typeof channelSplitterSchema> {
	readonly type = ["unit", "channel-splitter"] as const;
	readonly channels: Array<GainEffectUnit> = [];

	static override is(value: unknown): value is ChannelSplitterUnit {
		return Unit.is(value) && value.type[1] === "channel-splitter";
	}

	constructor(input: z.infer<typeof channelSplitterSchema> & UnitInput = { channelCount: 2 }) {
		super(input, channelSplitterSchema);

		for (let ch = 0; ch < this.parameters.channelCount.value; ch++) {
			this.channels.push(linearGain({ level: 1 }));
		}
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const splitter = context.audioContext.createChannelSplitter(this.channels.length);

		for (let ch = 0; ch < this.channels.length; ch++) {
			const channel = this.channels[ch];

			if (!channel) continue;

			await channel.setup(context);

			const entry = channel.entryNodes[0];

			if (entry) splitter.connect(entry, ch);
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
