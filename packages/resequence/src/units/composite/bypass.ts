import type { ScheduleContext } from "../../rendering/schedule-context";
import { linearGain, type GainEffectUnit } from "../effects/gain";
import type { MidiUnitInput, MidiUnitProperties } from "../midi-unit";
import { MidiUnit } from "../midi-unit";
import type { SetupResult } from "../unit";
import type { Unit } from "../unit";
import { Composite } from "./composite";

export interface BypassProperties extends MidiUnitProperties {
	readonly inner: Unit;
}

export class BypassUnit extends MidiUnit {
	readonly type = ["unit", "midi", "bypass"] as const;
	readonly properties: BypassProperties;

	static is(value: unknown): value is BypassUnit {
		return MidiUnit.is(value) && value.type[2] === "bypass";
	}

	readonly inner: Unit;
	private passthrough: GainEffectUnit | undefined;

	constructor(properties: MidiUnitInput<BypassProperties>) {
		super(properties);
		this.properties = {
			...properties,
			targets: properties.targets ?? [],
			modDeclarations: properties.modDeclarations ?? [],
			noteModDeclarations: properties.noteModDeclarations ?? [],
		};
		this.inner = properties.inner;
	}

	clone(overrides?: Partial<BypassProperties>): BypassUnit {
		return new BypassUnit({ ...this.properties, ...overrides });
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
	const targets: Array<Unit> = [...unit.targets];
	unit.targets.length = 0;

	if (unit instanceof Composite) {
		const tail = "tail" in unit ? (unit as { tail: Unit }).tail : undefined;
		if (tail) {
			for (const target of tail.targets) {
				if (!targets.includes(target)) targets.push(target);
			}
			tail.targets.length = 0;
		}
	}

	return new BypassUnit({ inner: unit, targets });
}
