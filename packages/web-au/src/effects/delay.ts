import type { SetupResult, UnitContext, UnitInput, UnitProperties } from "@resequence/web-au-core";
import { Unit, driveParam } from "@resequence/web-au-core";

import { linearGain, type GainEffectUnit } from "./gain";

export interface DelayProperties extends UnitProperties {
	readonly time: number;
	readonly feedback?: number;
}

export class DelayEffectUnit extends Unit {
	readonly type = ["unit", "delay"] as const;

	static override is(value: unknown): value is DelayEffectUnit {
		return Unit.is(value) && value.type[1] === "delay";
	}

	declare readonly properties: DelayProperties;
	public delayNode: DelayNode | undefined;
	private feedbackUnit: GainEffectUnit | undefined;

	constructor(properties: UnitInput<DelayProperties>) {
		super(properties);
		this.properties = { ...properties, targets: properties.targets ?? [], modDeclarations: properties.modDeclarations ?? [] };
	}

	get time(): number { return this.properties.time; }
	get feedback(): number | undefined { return this.properties.feedback; }

	protected override _setup(context: UnitContext): SetupResult {
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

	protected override _teardown(context: UnitContext): void {
		this.feedbackUnit?.teardown(context);
		this.feedbackUnit = undefined;
		this.delayNode = undefined;
	}
}

export function delay({ time, feedback, id }: { time: number; feedback?: number; id?: string }): DelayEffectUnit {
	return new DelayEffectUnit({ time, feedback, id });
}
