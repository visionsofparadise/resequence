import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import { Unit } from "../unit";

export type FilterMode = "lowpass" | "highpass" | "bandpass" | "peaking" | "notch" | "lowshelf" | "highshelf" | "allpass";

export class FilterEffectUnit extends Unit {
	readonly type = "filter" as const;
	protected readonly innerUnits: ReadonlyArray<Unit> = [];

	private readonly mode: FilterMode;
	private readonly frequency: number;
	private readonly resonance: number | undefined;
	private readonly gain: number | undefined;
	public readonly id?: string;
	filterNode: BiquadFilterNode | undefined;

	constructor({ mode, frequency, resonance, gain, id }: { mode: FilterMode; frequency: number; resonance?: number; gain?: number; id?: string }) {
		super();
		this.mode = mode;
		this.frequency = frequency;
		this.resonance = resonance;
		this.gain = gain;
		this.id = id;
	}

	protected _setup(context: ScheduleContext): void {
		const filterNode = context.audioContext.createBiquadFilter();
		filterNode.type = this.mode;
		driveParam(filterNode.frequency, this.id, "frequency", this.frequency, context, [20, 20000]);
		if (this.resonance !== undefined || this.id) driveParam(filterNode.Q, this.id, "resonance", this.resonance ?? 1, context, [0, 30]);
		if (this.gain !== undefined) filterNode.gain.value = this.gain;

		this.filterNode = filterNode;
		this.entryNodes.push(filterNode);
		this.exitNodes.push(filterNode);
	}

	protected _teardown(_context: ScheduleContext): void {
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
