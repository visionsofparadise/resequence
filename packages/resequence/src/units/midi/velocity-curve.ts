import type { ScheduleContext } from "../../rendering/schedule-context";
import type { VoiceNote } from "../midi-unit";
import { MidiUnit } from "../midi-unit";
import type { Unit } from "../unit";

export class VelocityCurveMidiUnit extends MidiUnit {
	readonly type = "velocity-curve-midi" as const;
	readonly id = undefined;
	protected readonly innerUnits: ReadonlyArray<Unit> = [];

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

	protected _schedule(): void {
		return;
	}

	protected _setup(): void {
		return;
	}

	protected _teardown(): void {
		return;
	}
}

export function velocityCurve(curve: (velocity: number) => number): VelocityCurveMidiUnit {
	return new VelocityCurveMidiUnit(curve);
}
