import type { ScheduleContext } from "../../rendering/schedule-context";
import type { SetupResult } from "../unit";
import { Unit } from "../unit";
import { type GainEffectUnit, linearGain } from "./gain";

export class ChannelMergerUnit extends Unit {
	readonly type = ["unit", "channel-merger"] as const;
	readonly channels: Array<GainEffectUnit> = [];

	static is(value: unknown): value is ChannelMergerUnit {
		return Unit.is(value) && value.type[1] === "channel-merger";
	}

	constructor(private readonly channelCount = 2) {
		super();

		for (let ch = 0; ch < this.channelCount; ch++) {
			this.channels.push(linearGain({ level: 1 }));
		}
	}

	protected async _setup(context: ScheduleContext): Promise<SetupResult> {
		const merger = context.audioContext.createChannelMerger(this.channelCount);

		for (let ch = 0; ch < this.channelCount; ch++) {
			const channel = this.channels[ch];
			if (!channel) continue;

			await channel.setup(context);

			for (const exit of channel.exitNodes) {
				exit.connect(merger, 0, ch);
			}
		}

		return { entries: [...this.channels], exits: [merger] };
	}

	protected _teardown(context: ScheduleContext): void {
		for (const channel of this.channels) channel.teardown(context);
	}
}

export function channelMerger(channels?: number): ChannelMergerUnit {
	return new ChannelMergerUnit(channels);
}

export function merge(channels?: number): ChannelMergerUnit {
	return new ChannelMergerUnit(channels);
}
