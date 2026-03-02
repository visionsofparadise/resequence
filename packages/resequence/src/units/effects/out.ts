import type { ScheduleContext } from "../../rendering/schedule-context";
import type { SetupResult } from "../unit";
import { Unit } from "../unit";

export class OutUnit extends Unit {
	readonly type = ["unit", "out"] as const;

	static is(value: unknown): value is OutUnit {
		return Unit.is(value) && value.type[1] === "out";
	}

	protected _setup(context: ScheduleContext): SetupResult {
		return { entries: [context.audioContext.destination], exits: [] };
	}
}

export function out(): OutUnit {
	return new OutUnit();
}
