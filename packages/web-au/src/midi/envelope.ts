import type { NoteEvent, SetupResult, UnitContext, MidiUnitInput } from "@resequence/web-au-core";
import { driveParam, MidiUnit, live } from "@resequence/web-au-core";
import { z } from "zod";

export interface EnvelopeAdsr {
	readonly attack?: number;
	readonly hold?: number;
	readonly decay?: number;
	readonly sustain?: number;
	readonly release?: number;
}

const envelopeSchema = z.object({
	attack: live(z.number().min(0).max(10).default(0.01).describe("Attack (s)")),
	hold: live(z.number().min(0).max(10).default(0).describe("Hold (s)")),
	decay: live(z.number().min(0).max(10).default(0.1).describe("Decay (s)")),
	sustain: live(z.number().min(0).max(1).default(0.7).describe("Sustain")),
	release: live(z.number().min(0).max(10).default(0.1).describe("Release (s)")),
});

export class EnvelopeUnit extends MidiUnit<typeof envelopeSchema> {
	readonly type = ["unit", "midi"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "envelope";

	public envelopeNode: AudioWorkletNode | undefined;
	private gateParam: AudioParam | undefined;

	readonly adsr: EnvelopeAdsr;

	constructor(input: { adsr: EnvelopeAdsr } & MidiUnitInput) {
		const adsr = input.adsr;

		// Convert ms ADSR values to seconds for schema parameters
		const schemaInput = {
			id: input.id,
			attack: (adsr.attack ?? 10) / 1000,
			hold: (adsr.hold ?? 0) / 1000,
			decay: (adsr.decay ?? 100) / 1000,
			sustain: adsr.sustain ?? 0.7,
			release: (adsr.release ?? 100) / 1000,
		};

		super(schemaInput, envelopeSchema);

		this.adsr = adsr;
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		await context.loadModule(new URL("../processors/envelope-processor.js", import.meta.url).href);

		const envelopeNode = new AudioWorkletNode(context.audioContext, "envelope-processor");

		envelopeNode.parameters.forEach((param, name) => {
			switch (name) {
				case "gate":
					this.gateParam = param;
					break;
				case "attack":
					driveParam(param, this.parameters.attack, undefined, context);
					break;
				case "hold":
					driveParam(param, this.parameters.hold, undefined, context);
					break;
				case "decay":
					driveParam(param, this.parameters.decay, undefined, context);
					break;
				case "sustain":
					driveParam(param, this.parameters.sustain, undefined, context);
					break;
				case "release":
					driveParam(param, this.parameters.release, undefined, context);
					break;
			}
		});

		this.envelopeNode = envelopeNode;

		return { entries: [envelopeNode], exits: [envelopeNode] };
	}

	protected override _teardown(_context: UnitContext): void {
		this.envelopeNode = undefined;
		this.gateParam = undefined;
	}

	protected override _schedule(noteEvent: NoteEvent, _context: UnitContext): void {
		if (!this.gateParam) return;

		this.gateParam.cancelScheduledValues(noteEvent.startMs / 1000);
		this.gateParam.setValueAtTime(1, noteEvent.startMs / 1000);
		this.gateParam.setValueAtTime(0, noteEvent.stopMs / 1000);
	}
}

export function envelope({ attack, hold, decay, sustain, release, id }: EnvelopeAdsr & { id?: string } = {}): EnvelopeUnit {
	return new EnvelopeUnit({ adsr: { attack, hold, decay, sustain, release }, id });
}

export const env = envelope;
