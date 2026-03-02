import type { ScheduleContext } from "../../rendering/schedule-context";
import type { VoiceNote } from "../midi-unit";
import { MidiUnit } from "../midi-unit";

export class VelocityCurveMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi", "velocity-curve"] as const;

	static is(value: unknown): value is VelocityCurveMidiUnit {
		return MidiUnit.is(value) && value.type[2] === "velocity-curve";
	}

	public readonly curve: (velocity: number) => number;

	constructor(curve: (velocity: number) => number) {
		super();

		this.curve = curve;
	}

	override schedule(voiceNote: VoiceNote, scheduleContext: ScheduleContext): void {
		const newVelocity = Math.max(1, Math.min(127, Math.round(this.curve(voiceNote.velocity))));
		const transformed: VoiceNote = { ...voiceNote, velocity: newVelocity };

		super.schedule(transformed, scheduleContext);
	}
}

export function velocityCurve(curve: (velocity: number) => number): VelocityCurveMidiUnit {
	return new VelocityCurveMidiUnit(curve);
}
