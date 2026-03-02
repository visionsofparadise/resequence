import type { ScheduleContext } from "../../rendering/schedule-context";
import { linearGain, type GainEffectUnit } from "../effects/gain";
import { MidiUnit } from "../midi-unit";
import type { SetupResult, Unit } from "../unit";
import { Composite } from "./composite";

export class BypassUnit extends MidiUnit {
	readonly type = ["unit", "midi", "bypass"] as const;

	static is(value: unknown): value is BypassUnit {
		return MidiUnit.is(value) && value.type[2] === "bypass";
	}

	readonly inner: Unit;
	private passthrough: GainEffectUnit | undefined;

	constructor(inner: Unit) {
		super();

		this.inner = inner;

		for (const target of inner.targets) {
			this.targets.push(target);
		}
		inner.targets.length = 0;

		if (inner instanceof Composite) {
			const tail = "tail" in inner ? (inner as { tail: Unit }).tail : undefined;
			if (tail) {
				for (const target of tail.targets) {
					if (!this.targets.includes(target)) this.targets.push(target);
				}
				tail.targets.length = 0;
			}
		}
	}

	protected _setup(context: ScheduleContext): SetupResult | Promise<SetupResult> {
		const passthrough = linearGain({ level: 1 });
		this.passthrough = passthrough;

		const innerResult = this.inner.setup(context);
		const finish = (): SetupResult | Promise<SetupResult> => {
			const passthroughResult = passthrough.setup(context);
			if (passthroughResult instanceof Promise) {
				return passthroughResult.then(() => ({ entries: [passthrough], exits: [passthrough] }));
			}
			return { entries: [passthrough], exits: [passthrough] };
		};

		if (innerResult instanceof Promise) {
			return innerResult.then(finish);
		}

		return finish();
	}

	protected _teardown(context: ScheduleContext): void {
		this.inner.teardown(context);
		this.passthrough?.teardown(context);
		this.passthrough = undefined;
	}
}

export function bypass(unit: Unit): BypassUnit {
	return new BypassUnit(unit);
}
