import type { ScheduleContext } from "../rendering/schedule-context";
import type { SetupResult, UnitProperties } from "./unit";
import { Unit } from "./unit";

export class OutUnit extends Unit {
	readonly type = ["unit", "out"] as const;

	static is(value: unknown): value is OutUnit {
		return Unit.is(value) && value.type[1] === "out";
	}

	clone(overrides?: Partial<UnitProperties>): OutUnit {
		return new OutUnit({ ...this.properties, ...overrides });
	}

	protected _setup(context: ScheduleContext): SetupResult {
		return { entries: [context.audioContext.destination], exits: [] };
	}
}

export function out(): OutUnit {
	return new OutUnit();
}
