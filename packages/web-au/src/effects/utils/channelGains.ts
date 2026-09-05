import { z } from "zod";
import { linearGain, type GainEffectUnit } from "../gain";
import type { UnitContext } from "@resequence/web-au-core";

export const channelCountSchema = z.object({
	channelCount: z.number().min(1).max(32).default(2).describe("Channel Count"),
});

export function channelGainsOf(channelCount: number): Array<GainEffectUnit> {
	const channels: Array<GainEffectUnit> = [];

	for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
		channels.push(linearGain({ level: 1 }));
	}

	return channels;
}

export async function setupChannels(channels: ReadonlyArray<GainEffectUnit>, context: UnitContext): Promise<void> {
	for (const channel of channels) {
		await channel.setup(context);
	}
}
