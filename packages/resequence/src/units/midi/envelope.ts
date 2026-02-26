import type { ScheduleContext } from "../../rendering/schedule-context";
import { driveParam } from "../../utils/driver";
import type { VoiceNote } from "../midi-unit";
import { MidiUnit } from "../midi-unit";
import type { Unit } from "../unit";

export interface EnvelopeAdsr {
	readonly attack?: number;
	readonly hold?: number;
	readonly decay?: number;
	readonly sustain?: number;
	readonly release?: number;
}

export class EnvelopeUnit extends MidiUnit {
	protected readonly innerUnits: ReadonlyArray<Unit> = [];

	private readonly adsr: EnvelopeAdsr;
	public readonly id?: string;

	public envelopeNode: AudioWorkletNode | undefined;
	private gateParam: AudioParam | undefined;

	constructor(adsr: EnvelopeAdsr, id?: string) {
		super();

		this.adsr = adsr;
		this.id = id;
	}

	collectModuleUrls(): Set<string> {
		const urls = super.collectModuleUrls();
		urls.add(new URL("./envelope-processor.js", import.meta.url).href);
		return urls;
	}

	protected _setup(context: ScheduleContext): void {
		const envelopeNode = new AudioWorkletNode(context.audioContext, "envelope-processor");

		envelopeNode.parameters.forEach((param, name) => {
			switch (name) {
				case "gate":
					this.gateParam = param;
					break;
				case "attack":
					driveParam(param, this.id, "attack", (this.adsr.attack ?? 10) / 1000, context, [0, 10]);
					break;
				case "hold":
					driveParam(param, this.id, "hold", (this.adsr.hold ?? 0) / 1000, context, [0, 10]);
					break;
				case "decay":
					driveParam(param, this.id, "decay", (this.adsr.decay ?? 100) / 1000, context, [0, 10]);
					break;
				case "sustain":
					driveParam(param, this.id, "sustain", this.adsr.sustain ?? 0.7, context, [0, 1]);
					break;
				case "release":
					driveParam(param, this.id, "release", (this.adsr.release ?? 100) / 1000, context, [0, 10]);
					break;
			}
		});

		this.envelopeNode = envelopeNode;
		this.entryNodes.push(envelopeNode);
		this.exitNodes.push(envelopeNode);
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
	return new EnvelopeUnit({ attack, hold, decay, sustain, release }, id);
}

export const env = envelope;
