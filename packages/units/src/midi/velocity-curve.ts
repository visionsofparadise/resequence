import type { UnitContext } from "../context";
import type { MidiUnitProperties } from "../midi-unit";
import { MidiUnit, type MidiUnitInput } from "../midi-unit";
import type { NoteEvent } from "../note-event";

export interface VelocityCurveProperties extends MidiUnitProperties {
	readonly curve: (velocity: number) => number;
	readonly previousProperties?: VelocityCurveProperties;
}

export class VelocityCurveMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "velocity-curve"] as const;
	declare readonly properties: VelocityCurveProperties;

	static override is(value: unknown): value is VelocityCurveMidiUnit {
		return MidiUnit.is(value) && value.type[2] === "velocity-curve";
	}

	get curve(): (velocity: number) => number {
		return this.properties.curve;
	}

	constructor(properties: MidiUnitInput<VelocityCurveProperties>) {
		super(properties);
		this.properties = {
			...properties,
			targets: properties.targets ?? [],
			modDeclarations: properties.modDeclarations ?? [],
			noteModDeclarations: properties.noteModDeclarations ?? [],
		};
	}

	clone(overrides?: Partial<VelocityCurveProperties>): VelocityCurveMidiUnit {
		return new VelocityCurveMidiUnit({ ...this.properties, ...overrides, previousProperties: this.properties });
	}

	override schedule(noteEvent: NoteEvent, context: UnitContext): void {
		const newVelocity = Math.max(1, Math.min(127, Math.round(this.curve(noteEvent.velocity))));
		const transformed: NoteEvent = { ...noteEvent, velocity: newVelocity };

		super.schedule(transformed, context);
	}
}

export function velocityCurve(curve: (velocity: number) => number): VelocityCurveMidiUnit {
	return new VelocityCurveMidiUnit({ curve });
}
