import type { ScheduleContext } from "../../rendering/schedule-context";
import type { SetupResult } from "../unit";
import { Unit } from "../unit";

export class OutUnit extends Unit {
	protected _setup(context: ScheduleContext): SetupResult {
		return { entries: [context.audioContext.destination], exits: [] };
	}
}

export function out(): OutUnit {
	return new OutUnit();
}
