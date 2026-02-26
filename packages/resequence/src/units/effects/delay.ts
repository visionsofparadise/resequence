import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import { Unit } from "../unit";

export class DelayEffectUnit extends Unit {
	readonly type = "delay" as const;

	private readonly time: number;
	private readonly feedback: number | undefined;
	public readonly id?: string;
	delayNode: DelayNode | undefined;

	constructor({ time, feedback, id }: { time: number; feedback?: number; id?: string }) {
		super();
		this.time = time;
		this.feedback = feedback;
		this.id = id;
	}

	protected _setup(context: ScheduleContext): void {
		const timeSeconds = this.time / 1000;
		const delayNode = context.audioContext.createDelay(timeSeconds + 1);
		driveParam(delayNode.delayTime, this.id, "time", timeSeconds, context);

		if (this.feedback !== undefined && this.feedback > 0) {
			const feedbackGain = context.audioContext.createGain();
			feedbackGain.gain.value = this.feedback;
			delayNode.connect(feedbackGain);
			feedbackGain.connect(delayNode);
		}

		this.delayNode = delayNode;
		this.entryNodes.push(delayNode);
		this.exitNodes.push(delayNode);
	}

	protected _teardown(_context: ScheduleContext): void {
		this.delayNode = undefined;
	}
}

export function delay({ time, feedback, id }: { time: number; feedback?: number; id?: string }): DelayEffectUnit {
	return new DelayEffectUnit({ time, feedback, id });
}
