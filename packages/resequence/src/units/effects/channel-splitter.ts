import type { ScheduleContext } from "../../rendering/schedule-context";
import type { SetupResult } from "../unit";
import { Unit } from "../unit";
import { type GainEffectUnit, linearGain } from "./gain";

export class ChannelSplitterUnit extends Unit {
	readonly type = ["unit", "channel-splitter"] as const;
	readonly channels: Array<GainEffectUnit> = [];

	static is(value: unknown): value is ChannelSplitterUnit {
		return Unit.is(value) && value.type[1] === "channel-splitter";
	}

	constructor(private readonly channelCount = 2) {
		super();

		for (let ch = 0; ch < this.channelCount; ch++) {
			this.channels.push(linearGain({ level: 1 }));
		}
	}

	protected async _setup(context: ScheduleContext): Promise<SetupResult> {
		const splitter = context.audioContext.createChannelSplitter(this.channelCount);

		for (let ch = 0; ch < this.channelCount; ch++) {
			const channel = this.channels[ch];
			if (!channel) continue;

			await channel.setup(context);

			const entry = channel.entryNodes[0];
			if (entry) splitter.connect(entry, ch);
		}

		return { entries: [splitter], exits: [...this.channels] };
	}

	protected _teardown(context: ScheduleContext): void {
		for (const channel of this.channels) channel.teardown(context);
	}
}

export function channelSplitter(channels?: number): ChannelSplitterUnit {
	return new ChannelSplitterUnit(channels);
}

export function split(channels?: number): ChannelSplitterUnit {
	return new ChannelSplitterUnit(channels);
}
