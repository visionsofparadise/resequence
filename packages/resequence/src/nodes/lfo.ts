import type { ScheduleContext } from "../rendering/schedule-context";
import { getOrCreateDriver } from "../rendering/schedule-context";
import { Node } from "./node";
import type { MidiAudio, NoteContext } from "./node";

export interface LfoOptions {
	readonly shape: OscillatorType;
	readonly rate: number;
	readonly depth: number;
}

export class LfoNode extends Node<MidiAudio, MidiAudio> {
	readonly id?: string;

	constructor(
		readonly path: string,
		readonly options: LfoOptions,
	) {
		super();
	}

	setup(_context: ScheduleContext): void {
		return;
	}

	prepare(note: NoteContext, context: ScheduleContext): void {
		const driver = getOrCreateDriver(this.path, 0, context);

		const osc = context.audioContext.createOscillator();
		osc.type = this.options.shape;
		osc.frequency.value = this.options.rate;

		const depthGain = context.audioContext.createGain();
		depthGain.gain.value = this.options.depth;

		osc.connect(depthGain);
		depthGain.connect(driver.offset);

		osc.start(note.startTime);
		osc.stop(note.cleanupTime);

		osc.addEventListener("ended", () => {
			depthGain.disconnect(driver.offset);
			osc.disconnect(depthGain);
			depthGain.disconnect();
		});

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

export function lfo(path: string, options: LfoOptions): LfoNode {
	return new LfoNode(path, options);
}
