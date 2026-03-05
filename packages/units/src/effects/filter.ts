import type { UnitContext } from "../context";
import { driveParam } from "../utils/driver";
import type { SetupResult, UnitInput, UnitProperties } from "../unit";
import { Unit } from "../unit";

export type FilterMode = "lowpass" | "highpass" | "bandpass" | "peaking" | "notch" | "lowshelf" | "highshelf" | "allpass";

export interface FilterProperties extends UnitProperties {
	readonly mode: FilterMode;
	readonly frequency: number;
	readonly resonance?: number;
	readonly gain?: number;
	readonly previousProperties?: FilterProperties;
}

export class FilterEffectUnit extends Unit {
	readonly type = ["unit", "filter"] as const;

	static override is(value: unknown): value is FilterEffectUnit {
		return Unit.is(value) && value.type[1] === "filter";
	}

	declare readonly properties: FilterProperties;
	public filterNode: BiquadFilterNode | undefined;

	constructor(properties: UnitInput<FilterProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get mode(): FilterMode { return this.properties.mode; }
	get frequency(): number { return this.properties.frequency; }
	get resonance(): number | undefined { return this.properties.resonance; }
	get gain(): number | undefined { return this.properties.gain; }

	clone(overrides?: Partial<FilterProperties>): FilterEffectUnit {
		return new FilterEffectUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override _setup(context: UnitContext): SetupResult {
		const filterNode = context.audioContext.createBiquadFilter();
		filterNode.type = this.mode;
		driveParam(filterNode.frequency, this.id ? `${this.id}.frequency` : undefined, this.frequency, [20, 20000], context);
		if (this.resonance !== undefined || this.id) driveParam(filterNode.Q, this.id ? `${this.id}.resonance` : undefined, this.resonance ?? 1, [0, 30], context);
		if (this.gain !== undefined) filterNode.gain.value = this.gain;

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
