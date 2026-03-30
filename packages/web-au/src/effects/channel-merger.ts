import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { Unit } from "@resequence/web-au-core";
import { z } from "zod";
import { type GainEffectUnit, linearGain } from "./gain";

const channelMergerSchema = z.object({
	channelCount: z.number().min(1).max(32).default(2).describe("Channel Count"),
});

export class ChannelMergerUnit extends Unit<typeof channelMergerSchema> {
	readonly type = ["unit", "channel-merger"] as const;
	readonly channels: Array<GainEffectUnit> = [];

	static override is(value: unknown): value is ChannelMergerUnit {
		return Unit.is(value) && value.type[1] === "channel-merger";
	}

	constructor(input: z.infer<typeof channelMergerSchema> & UnitInput = { channelCount: 2 }) {
		super(input, channelMergerSchema);

		for (let ch = 0; ch < this.parameters.channelCount.value; ch++) {
			this.channels.push(linearGain({ level: 1 }));
		}
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const merger = context.audioContext.createChannelMerger(this.channels.length);

		for (let ch = 0; ch < this.channels.length; ch++) {
			const channel = this.channels[ch];

			if (!channel) continue;

			await channel.setup(context);

			for (const exit of channel.exitNodes) {
				exit.connect(merger, 0, ch);
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
