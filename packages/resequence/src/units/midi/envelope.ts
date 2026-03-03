import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import type { MidiUnitProperties, VoiceNote } from "../midi-unit";
import { MidiUnit, type MidiUnitInput } from "../midi-unit";
import type { SetupResult } from "../unit";

export interface EnvelopeAdsr {
	readonly attack?: number;
	readonly hold?: number;
	readonly decay?: number;
	readonly sustain?: number;
	readonly release?: number;
}

export interface EnvelopeProperties extends MidiUnitProperties {
	readonly adsr: EnvelopeAdsr;
}

export class EnvelopeUnit extends MidiUnit {
	readonly type = ["unit", "midi", "envelope"] as const;
	readonly properties: EnvelopeProperties;

	static is(value: unknown): value is EnvelopeUnit {
		return MidiUnit.is(value) && value.type[2] === "envelope";
	}

	public envelopeNode: AudioWorkletNode | undefined;
	private gateParam: AudioParam | undefined;

	get adsr(): EnvelopeAdsr {
		return this.properties.adsr;
	}

	constructor(properties: MidiUnitInput<EnvelopeProperties>) {
		super(properties);
		this.properties = {
			...properties,
			targets: properties.targets ?? [],
			modDeclarations: properties.modDeclarations ?? [],
			noteModDeclarations: properties.noteModDeclarations ?? [],
		};
	}

	clone(overrides?: Partial<EnvelopeProperties>): EnvelopeUnit {
		return new EnvelopeUnit({ ...this.properties, ...overrides });
	}

	protected async _setup(context: ScheduleContext): Promise<SetupResult> {
		await context.loadModule(new URL("./envelope-processor.js", import.meta.url).href);

		const envelopeNode = new AudioWorkletNode(context.audioContext, "envelope-processor");

		envelopeNode.parameters.forEach((param, name) => {
			switch (name) {
				case "gate":
					this.gateParam = param;
					break;
				case "attack":
					driveParam(param, this.id ? `${this.id}.attack` : undefined, (this.adsr.attack ?? 10) / 1000, [0, 10], context);
					break;
				case "hold":
					driveParam(param, this.id ? `${this.id}.hold` : undefined, (this.adsr.hold ?? 0) / 1000, [0, 10], context);
					break;
				case "decay":
					driveParam(param, this.id ? `${this.id}.decay` : undefined, (this.adsr.decay ?? 100) / 1000, [0, 10], context);
					break;
				case "sustain":
					driveParam(param, this.id ? `${this.id}.sustain` : undefined, this.adsr.sustain ?? 0.7, [0, 1], context);
					break;
				case "release":
					driveParam(param, this.id ? `${this.id}.release` : undefined, (this.adsr.release ?? 100) / 1000, [0, 10], context);
					break;
			}
		});

		this.envelopeNode = envelopeNode;
		return { entries: [envelopeNode], exits: [envelopeNode] };
	}

	protected _teardown(_context: ScheduleContext): void {
		this.envelopeNode = undefined;
		this.gateParam = undefined;
	}

	protected _schedule(voiceNote: VoiceNote, _scheduleContext: ScheduleContext): void {
		if (!this.gateParam) return;

		this.gateParam.cancelScheduledValues(voiceNote.startMs / 1000);
		this.gateParam.setValueAtTime(1, voiceNote.startMs / 1000);
		this.gateParam.setValueAtTime(0, voiceNote.stopMs / 1000);
	}
}

export function envelope({ attack, hold, decay, sustain, release, id }: EnvelopeAdsr & { id?: string } = {}): EnvelopeUnit {
	return new EnvelopeUnit({ adsr: { attack, hold, decay, sustain, release }, id });
}

export const env = envelope;
