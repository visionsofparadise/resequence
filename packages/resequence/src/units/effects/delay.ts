import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import type { SetupResult } from "../unit";
import { Unit } from "../unit";
import { linearGain, type GainEffectUnit } from "./gain";

export class DelayEffectUnit extends Unit {
	readonly type = ["unit", "delay"] as const;

	static is(value: unknown): value is DelayEffectUnit {
		return Unit.is(value) && value.type[1] === "delay";
	}

	private readonly time: number;
	private readonly feedback: number | undefined;
	public readonly id?: string;
	delayNode: DelayNode | undefined;
	private feedbackUnit: GainEffectUnit | undefined;

	constructor({ time, feedback, id }: { time: number; feedback?: number; id?: string }) {
		super();
		this.time = time;
		this.feedback = feedback;
		this.id = id;
	}

	protected _setup(context: ScheduleContext): SetupResult {
		const timeSeconds = this.time / 1000;
		const delayNode = context.audioContext.createDelay(timeSeconds + 1);

		driveParam(delayNode.delayTime, this.id ? `${this.id}.time` : undefined, timeSeconds, [0, 5], context);

		if (this.feedback !== undefined && this.feedback > 0) {
			const feedbackUnit = linearGain({ level: this.feedback });
			void feedbackUnit.setup(context);

			for (const entry of feedbackUnit.entryNodes) delayNode.connect(entry);
			for (const exit of feedbackUnit.exitNodes) exit.connect(delayNode);

			this.feedbackUnit = feedbackUnit;
		}

		this.delayNode = delayNode;

		return { entries: [delayNode], exits: [delayNode] };
	}

	protected _teardown(context: ScheduleContext): void {
		this.feedbackUnit?.teardown(context);
		this.feedbackUnit = undefined;
		this.delayNode = undefined;
	}
}

export function delay({ time, feedback, id }: { time: number; feedback?: number; id?: string }): DelayEffectUnit {
	return new DelayEffectUnit({ time, feedback, id });
}
