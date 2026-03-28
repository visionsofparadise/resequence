import type { MidiUnitInput, MidiUnitProperties, SetupResult, Unit, UnitContext } from "@resequence/web-au-core";
import { CompositeUnit, MidiUnit } from "@resequence/web-au-core";
import { linearGain, type GainEffectUnit } from "../effects/gain";

export interface BypassProperties extends MidiUnitProperties {
	readonly inner: Unit;
}

export class BypassUnit extends MidiUnit {
	readonly type = ["unit", "midi", "bypass"] as const;
	declare readonly properties: BypassProperties;

	static override is(value: unknown): value is BypassUnit {
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

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const passthrough = linearGain({ level: 1 });

		this.passthrough = passthrough;

		await this.inner.setup(context);

		return { entries: [passthrough], exits: [passthrough] };
	}

	protected override _teardown(context: UnitContext): void {
		this.inner.teardown(context);
		this.passthrough?.teardown(context);
		this.passthrough = undefined;
	}
}

export function bypass(unit: Unit): BypassUnit {
	const targets: Array<Unit> = [...unit.targets];

	unit.targets.length = 0;

	if (unit instanceof CompositeUnit) {
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
