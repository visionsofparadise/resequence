import type { ScheduleContext } from "../rendering/schedule-context";
import { getOrCreateDriver } from "../rendering/schedule-context";
import type { MidiAudio, NoteContext } from "./node";
import { Node } from "./node";

export interface EnvelopeAdsr {
	readonly attack?: number;
	readonly hold?: number;
	readonly decay?: number;
	readonly sustain?: number;
	readonly release?: number;
}

export class EnvelopeNode extends Node<MidiAudio, MidiAudio> {
	readonly id?: string;

	constructor(
		readonly path: string,
		readonly adsr: EnvelopeAdsr,
	) {
		super();
	}

	setup(_context: ScheduleContext): void {
		return;
	}

	prepare(note: NoteContext, context: ScheduleContext): void {
		const driver = getOrCreateDriver(this.path, 0, context);

		const attack = this.adsr.attack ?? 0.01;
		const hold = this.adsr.hold ?? 0;
		const decay = this.adsr.decay ?? 0.1;
		const sustain = this.adsr.sustain ?? 0.7;
		const release = this.adsr.release ?? 0.1;
		const { startTime, stopTime } = note;

		driver.offset.cancelScheduledValues(startTime);
		driver.offset.setValueAtTime(0, startTime);
		driver.offset.linearRampToValueAtTime(1, startTime + attack);
		driver.offset.setValueAtTime(1, startTime + attack + hold);
		driver.offset.linearRampToValueAtTime(sustain, startTime + attack + hold + decay);
		driver.offset.setValueAtTime(sustain, stopTime);
		driver.offset.linearRampToValueAtTime(0, stopTime + release);

		// TODO: envelopes may need to extend targets stop times

		for (const node of this.outputs) node.prepare(note, context);
	}

	schedule(audio: AudioNode, noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		if (this.outputs.length === 0) {
			audio.connect(scheduleContext.audioContext.destination);
		} else {
			for (const node of this.outputs) {
				node.schedule(audio, noteContext, scheduleContext);
			}
		}
	}

	teardown(_context: ScheduleContext): void {
		return;
	}
}

export function envelope(path: string, adsr: EnvelopeAdsr): EnvelopeNode {
	return new EnvelopeNode(path, adsr);
}

export const env = envelope;
