import type { SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { Unit, driveParam, LiveParameter, live } from "@resequence/web-au-core";
import { z } from "zod";
import { linearGain, type GainEffectUnit } from "./gain";

const delaySchema = z.object({
	time: z.number().min(0).max(5000).default(250).describe("Time (ms)"),
	feedback: live(z.number().min(0).max(1).default(0).describe("Feedback")).optional(),
});

export class DelayEffectUnit extends Unit<typeof delaySchema> {
	readonly type = ["unit"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "delay";

	public delayNode: DelayNode | undefined;
	private feedbackUnit: GainEffectUnit | undefined;

	constructor(input: z.infer<typeof delaySchema> & UnitInput) {
		super(input, delaySchema);
	}

	protected override _setup(context: UnitContext): SetupResult {
		const timeSeconds = this.parameters.time.value / 1000;
		const delayNode = context.audioContext.createDelay(timeSeconds + 1);

		const timeLiveParam = new LiveParameter(this.id ? `${this.id}.time` : null, timeSeconds, 0, 5);

		driveParam(delayNode.delayTime, timeLiveParam, (ms: number) => ms / 1000, context);

		if (this.parameters.feedback?.value !== undefined && this.parameters.feedback.value > 0) {
			const feedbackUnit = linearGain({ level: this.parameters.feedback.value });

			void feedbackUnit.setup(context);

			for (const entry of feedbackUnit.entryNodes) delayNode.connect(entry);
			for (const exit of feedbackUnit.exitNodes) exit.connect(delayNode);

			this.feedbackUnit = feedbackUnit;
		}

		this.delayNode = delayNode;

		return { entries: [delayNode], exits: [delayNode] };
	}

	protected override _teardown(context: UnitContext): void {
		this.feedbackUnit?.teardown(context);
		this.feedbackUnit = undefined;
		this.delayNode = undefined;
	}
}

export function delay({ time, feedback, id }: { time: number; feedback?: number; id?: string }): DelayEffectUnit {
	return new DelayEffectUnit({ time, feedback, id });
}
