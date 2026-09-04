import { Unit, driveParam, live } from "@resequence/web-au-core";
import { z } from "zod";
import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";

const gainSchema = z.object({
	level: live(z.number().min(0).max(2).default(1).describe("Level")),
});

export class GainEffectUnit extends Unit<typeof gainSchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "gain";

	public gainNode: GainNode | undefined;

	constructor(input: z.infer<typeof gainSchema> & UnitInput) {
		super(input, gainSchema);
	}

	protected override _setup(context: UnitContext): SetupResult {
		this.gainNode = context.audioContext.createGain();

		driveParam(this.gainNode.gain, this.parameters.level, undefined, context);

		return { entries: [this.gainNode], exits: [this.gainNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.gainNode = undefined;
	}
}

export function gain({ level, id }: { level: number; id?: string }): GainEffectUnit {
	return new GainEffectUnit({ level: dbToLinear(level), id });
}

export const fader = gain;

export function linearGain({ level, id }: { level: number; id?: string }): GainEffectUnit {
	return new GainEffectUnit({ level, id });
}

function dbToLinear(decibels: number): number {
	return 10 ** (decibels / 20);
}
