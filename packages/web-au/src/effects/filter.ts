import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { Unit, driveParam, live } from "@resequence/web-au-core";
import { z } from "zod";

export type FilterMode = "lowpass" | "highpass" | "bandpass" | "peaking" | "notch" | "lowshelf" | "highshelf" | "allpass";

const filterSchema = z.object({
	mode: z.enum(["lowpass", "highpass", "bandpass", "notch", "allpass", "peaking", "lowshelf", "highshelf"]).default("lowpass").describe("Mode"),
	frequency: live(z.number().min(20).max(20000).default(1000).describe("Frequency")),
	resonance: live(z.number().min(0).max(30).default(1).describe("Resonance").optional()),
	gain: live(z.number().min(-40).max(40).default(0).describe("Gain").optional()),
});

export class FilterEffectUnit extends Unit<typeof filterSchema> {
	readonly type = ["unit", "filter"] as const;

	static override is(value: unknown): value is FilterEffectUnit {
		return Unit.is(value) && value.type[1] === "filter";
	}


	public filterNode: BiquadFilterNode | undefined;

	constructor(input: z.infer<typeof filterSchema> & UnitInput) {
		super(input, filterSchema);
	}

	protected override _setup(context: UnitContext): SetupResult {
		const filterNode = context.audioContext.createBiquadFilter();

		filterNode.type = this.parameters.mode.value;
		driveParam(filterNode.frequency, this.parameters.frequency, undefined, context);
		driveParam(filterNode.Q, this.parameters.resonance, undefined, context);
		driveParam(filterNode.gain, this.parameters.gain, undefined, context);

		this.filterNode = filterNode;

		return { entries: [filterNode], exits: [filterNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.filterNode = undefined;
	}
}

export function filter({ mode, frequency, resonance, gain, id }: { mode: FilterMode; frequency: number; resonance?: number; gain?: number; id?: string }): FilterEffectUnit {
	return new FilterEffectUnit({ mode, frequency, resonance, gain, id });
}

export function lowpass({ frequency, resonance, id }: { frequency: number; resonance?: number; id?: string }): FilterEffectUnit {
	return filter({ mode: "lowpass", frequency, resonance, id });
}

export function highpass({ frequency, resonance, id }: { frequency: number; resonance?: number; id?: string }): FilterEffectUnit {
	return filter({ mode: "highpass", frequency, resonance, id });
}

export function bandpass({ frequency, resonance, id }: { frequency: number; resonance?: number; id?: string }): FilterEffectUnit {
	return filter({ mode: "bandpass", frequency, resonance, id });
}

export function notch({ frequency, resonance, id }: { frequency: number; resonance?: number; id?: string }): FilterEffectUnit {
	return filter({ mode: "notch", frequency, resonance, id });
}

export function allpass({ frequency, resonance, id }: { frequency: number; resonance?: number; id?: string }): FilterEffectUnit {
	return filter({ mode: "allpass", frequency, resonance, id });
}

export function peaking({ frequency, resonance, gain, id }: { frequency: number; resonance?: number; gain?: number; id?: string }): FilterEffectUnit {
	return filter({ mode: "peaking", frequency, resonance, gain, id });
}

export function lowshelf({ frequency, gain, id }: { frequency: number; gain?: number; id?: string }): FilterEffectUnit {
	return filter({ mode: "lowshelf", frequency, gain, id });
}

export function highshelf({ frequency, gain, id }: { frequency: number; gain?: number; id?: string }): FilterEffectUnit {
	return filter({ mode: "highshelf", frequency, gain, id });
}
