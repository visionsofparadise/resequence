import type { UnitContext } from "../context";
import type { SetupResult, UnitInput } from "../unit";
import { Unit, type UnitProperties } from "../unit";
import { type GainEffectUnit, linearGain } from "./gain";

export interface ChannelSplitterProperties extends UnitProperties {
	readonly channelCount?: number;
	readonly previousProperties?: ChannelSplitterProperties;
}

export class ChannelSplitterUnit extends Unit {
	readonly type = ["unit", "channel-splitter"] as const;
	readonly channels: Array<GainEffectUnit> = [];

	static override is(value: unknown): value is ChannelSplitterUnit {
		return Unit.is(value) && value.type[1] === "channel-splitter";
	}

	declare readonly properties: ChannelSplitterProperties;

	constructor(properties?: UnitInput<ChannelSplitterProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties?.targets ?? [], modDeclarations: properties?.modDeclarations ?? [], channelCount: properties?.channelCount ?? 2 };

		for (let ch = 0; ch < this.channelCount; ch++) {
			this.channels.push(linearGain({ level: 1 }));
		}
	}

	get channelCount(): number { return this.properties.channelCount ?? 2; }

	clone(overrides?: Partial<ChannelSplitterProperties>): ChannelSplitterUnit {
		return new ChannelSplitterUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
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

	protected override _teardown(context: UnitContext): void {
		for (const channel of this.channels) channel.teardown(context);
	}
}

export function channelSplitter(channels?: number): ChannelSplitterUnit {
	return new ChannelSplitterUnit({ channelCount: channels });
}

export function split(channels?: number): ChannelSplitterUnit {
	return new ChannelSplitterUnit({ channelCount: channels });
}
