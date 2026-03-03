import type { ScheduleContext } from "../../rendering/schedule-context";
import type { MidiUnitProperties, VoiceNote } from "../midi-unit";
import { MidiUnit, type MidiUnitInput } from "../midi-unit";

export interface VelocityCurveProperties extends MidiUnitProperties {
	readonly curve: (velocity: number) => number;
}

export class VelocityCurveMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "velocity-curve"] as const;
	readonly properties: VelocityCurveProperties;

	static is(value: unknown): value is VelocityCurveMidiUnit {
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
		return new VelocityCurveMidiUnit({ ...this.properties, ...overrides });
	}

	override schedule(voiceNote: VoiceNote, scheduleContext: ScheduleContext): void {
		const newVelocity = Math.max(1, Math.min(127, Math.round(this.curve(voiceNote.velocity))));
		const transformed: VoiceNote = { ...voiceNote, velocity: newVelocity };

		super.schedule(transformed, scheduleContext);
	}
}

export function velocityCurve(curve: (velocity: number) => number): VelocityCurveMidiUnit {
	return new VelocityCurveMidiUnit({ curve });
}
