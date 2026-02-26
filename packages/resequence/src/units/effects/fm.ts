import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import { Unit } from "../unit";

export interface FmOptions {
	readonly modulator: Unit;
	readonly depth: number;
	readonly id?: string;
}

export class FmEffectUnit extends Unit {
	readonly type = "fm" as const;

	public readonly modulator: Unit;
	public readonly depth: number;
	public readonly id?: string;
	protected readonly innerUnits: ReadonlyArray<Unit>;

	constructor({ modulator, depth, id }: FmOptions) {
		super();
		this.modulator = modulator;
		this.depth = depth;
		this.id = id;
		this.innerUnits = [modulator];
	}

	protected _setup(context: ScheduleContext): void {
		const depthGain = context.audioContext.createGain();

		driveParam(depthGain.gain, this.id, "depth", this.depth, context, [0, 10000]);

		this.modulator.setup(context);

		for (const exit of this.modulator.exitNodes) {
			exit.connect(depthGain);
		}

		this.exitNodes.push(depthGain);
	}

	protected _teardown(context: ScheduleContext): void {
		this.modulator.teardown(context);
	}
}

export function fm(options: FmOptions): FmEffectUnit {
	return new FmEffectUnit(options);
}
