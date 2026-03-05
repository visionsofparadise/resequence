import type { UnitContext } from "./context";
import type { SetupResult, UnitProperties } from "./unit";
import { Unit } from "./unit";

export class OutUnit extends Unit {
	readonly type = ["unit", "out"] as const;

	static override is(value: unknown): value is OutUnit {
		return Unit.is(value) && value.type[1] === "out";
	}

	clone(overrides?: Partial<UnitProperties>): OutUnit {
		return new OutUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	protected override _setup(context: UnitContext): SetupResult {
		return { entries: [context.audioContext.destination], exits: [] };
	}
}

export function out(): OutUnit {
	return new OutUnit();
}
