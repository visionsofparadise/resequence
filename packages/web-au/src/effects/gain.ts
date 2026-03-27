import type { SetupResult, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";

import { Unit, driveParam } from "@resequence/web-au-core";

export interface GainProperties extends UnitProperties {
	readonly level: number;
	readonly previousProperties?: GainProperties;
}

export class GainEffectUnit extends Unit {
	readonly type = ["unit", "gain"] as const;

	static override is(value: unknown): value is GainEffectUnit {
		return Unit.is(value) && value.type[1] === "gain";
	}

	declare readonly properties: GainProperties;
	public gainNode: GainNode | undefined;

	constructor(properties: UnitInput<GainProperties>) {
		super(properties);

		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get level(): number {
		return this.properties.level;
	}

	clone(overrides?: Partial<GainProperties>): GainEffectUnit {
		return new GainEffectUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override _setup(context: UnitContext): SetupResult {
		this.gainNode = context.audioContext.createGain();

		driveParam(this.gainNode.gain, this.id ? `${this.id}.level` : undefined, this.level, [0, 2], context);

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
