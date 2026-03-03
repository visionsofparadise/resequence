import type { ScheduleContext } from "../../rendering/schedule-context";
import type { SetupResult, UnitInput } from "../unit";
import { Unit, type UnitProperties } from "../unit";
import { type GainEffectUnit, linearGain } from "./gain";

export interface ChannelMergerProperties extends UnitProperties {
	readonly channelCount?: number;
}

export class ChannelMergerUnit extends Unit {
	readonly type = ["unit", "channel-merger"] as const;
	readonly channels: Array<GainEffectUnit> = [];

	static is(value: unknown): value is ChannelMergerUnit {
		return Unit.is(value) && value.type[1] === "channel-merger";
	}

	readonly properties: ChannelMergerProperties;

	constructor(properties?: UnitInput<ChannelMergerProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties?.targets ?? [], modDeclarations: properties?.modDeclarations ?? [], channelCount: properties?.channelCount ?? 2 };

		for (let ch = 0; ch < this.channelCount; ch++) {
			this.channels.push(linearGain({ level: 1 }));
		}
	}

	get channelCount(): number { return this.properties.channelCount ?? 2; }

	clone(overrides?: Partial<ChannelMergerProperties>): ChannelMergerUnit {
		return new ChannelMergerUnit({ ...this.properties, ...overrides });
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
	return new ChannelMergerUnit({ channelCount: channels });
}

export function merge(channels?: number): ChannelMergerUnit {
	return new ChannelMergerUnit({ channelCount: channels });
}
