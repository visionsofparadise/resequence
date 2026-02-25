import type { ScheduleContext } from "../../rendering/schedule-context";
import { getOrCreateDriver } from "../../rendering/schedule-context";
import { applyCC } from "../../rendering/schedule-notes";
import { Node } from "../node";
import type { Midi, MidiAudio, NoteContext } from "../node";

export interface OscillatorOptions {
	readonly detune?: number;
}

export class OscillatorNode extends Node<Midi, MidiAudio> {
	constructor(
		readonly oscillatorType: OscillatorType,
		readonly options: OscillatorOptions,
		readonly id?: string,
	) {
		super();
	}

	setup(_context: ScheduleContext): void {
		return;
	}

	prepare(note: NoteContext, context: ScheduleContext): void {
		if (this.id) {
			getOrCreateDriver(`${this.id}.frequency`, note.frequency, context);
			getOrCreateDriver(`${this.id}.detune`, this.options.detune ?? 0, context);
		}

		for (const node of this.outputs) node.prepare(note, context);
	}

	schedule(noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const oscillator = scheduleContext.audioContext.createOscillator();

		oscillator.type = this.oscillatorType;

		if (this.id) {
			const freqDriver = scheduleContext.driverMap.get(`${this.id}.frequency`);
			const detuneDriver = scheduleContext.driverMap.get(`${this.id}.detune`);

			if (freqDriver) {
				oscillator.frequency.value = 0;
				freqDriver.connect(oscillator.frequency);
			} else {
				oscillator.frequency.value = noteContext.frequency;
			}

			if (detuneDriver) {
				oscillator.detune.value = 0;
				detuneDriver.connect(oscillator.detune);
			} else {
				oscillator.detune.value = this.options.detune ?? 0;
			}
		} else {
			oscillator.frequency.value = noteContext.frequency;
			oscillator.detune.value = this.options.detune ?? 0;
		}

		oscillator.start(noteContext.startTime);
		oscillator.stop(noteContext.cleanupTime);

		const { node: chainEnd, cleanup } = applyCC(oscillator, noteContext.cc, noteContext, scheduleContext);

		if (this.outputs.length === 0) {
			chainEnd.connect(scheduleContext.audioContext.destination);
		} else {
			for (const node of this.outputs) {
				node.schedule(chainEnd, noteContext, scheduleContext);
			}
		}

		oscillator.addEventListener("ended", () => {
			if (this.id) {
				scheduleContext.driverMap.get(`${this.id}.frequency`)?.disconnect(oscillator.frequency);
				scheduleContext.driverMap.get(`${this.id}.detune`)?.disconnect(oscillator.detune);
			}
			cleanup();
			oscillator.disconnect();
		});
	}

	teardown(_context: ScheduleContext): void {
		return;
	}
}

export function oscillator(type: OscillatorType, options: OscillatorOptions = {}): OscillatorNode {
	return new OscillatorNode(type, options);
}

export const osc = oscillator;
