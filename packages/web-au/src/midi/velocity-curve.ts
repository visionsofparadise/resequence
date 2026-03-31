import type { NoteEvent, UnitContext, MidiUnitInput } from "@resequence/web-au-core";
import { MidiUnit } from "@resequence/web-au-core";
import { z } from "zod";

const velocityCurveSchema = z.object({});

export class VelocityCurveMidiUnit extends MidiUnit {
	readonly type = ["unit", "midi"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "velocity-curve";

	readonly curve: (velocity: number) => number;

	constructor(input: { curve: (velocity: number) => number } & MidiUnitInput) {
		super(input, velocityCurveSchema);
		this.curve = input.curve;
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
