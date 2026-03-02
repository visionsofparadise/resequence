import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import type { SetupResult } from "../unit";
import { Unit } from "../unit";

export class GainEffectUnit extends Unit {
	readonly type = ["unit", "gain"] as const;

	static is(value: unknown): value is GainEffectUnit {
		return Unit.is(value) && value.type[1] === "gain";
	}

	public gainNode: GainNode | undefined;

	constructor(
		private readonly level: number,
		public readonly id?: string,
	) {
		super();
	}

	protected _setup(context: ScheduleContext): SetupResult {
		this.gainNode = context.audioContext.createGain();

		driveParam(this.gainNode.gain, this.id ? `${this.id}.level` : undefined, this.level, [0, 2], context);

		return { entries: [this.gainNode], exits: [this.gainNode] };
	}

	protected _teardown(_context: ScheduleContext): void {
		this.gainNode = undefined;
	}
}

export function gain({ level, id }: { level: number; id?: string }): GainEffectUnit {
	return new GainEffectUnit(dbToLinear(level), id);
}

export const fader = gain;

export function linearGain({ level, id }: { level: number; id?: string }): GainEffectUnit {
	return new GainEffectUnit(level, id);
}

function dbToLinear(db: number): number {
	return 10 ** (db / 20);
}
