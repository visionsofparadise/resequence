import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import { Unit } from "../unit";

export class GainEffectUnit extends Unit {
	readonly type = "gain" as const;
	protected readonly innerUnits: ReadonlyArray<Unit> = [];

	public gainNode: GainNode | undefined;

	constructor(
		private readonly level: number,
		public readonly id?: string,
	) {
		super();
	}

	protected _setup(context: ScheduleContext): void {
		this.gainNode = context.audioContext.createGain();
		driveParam(this.gainNode.gain, this.id, "level", this.level, context, [0, 2]);

		this.entryNodes.push(this.gainNode);
		this.exitNodes.push(this.gainNode);
	}

	protected _teardown(_context: ScheduleContext): void {
		this.gainNode = undefined;
	}
}

export function gain({ level, id }: { level: number; id?: string }): GainEffectUnit {
	return new GainEffectUnit(dbToLinear(level), id);
}

export function linearGain({ level, id }: { level: number; id?: string }): GainEffectUnit {
	return new GainEffectUnit(level, id);
}

function dbToLinear(db: number): number {
	return 10 ** (db / 20);
}
