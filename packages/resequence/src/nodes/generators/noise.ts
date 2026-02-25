import type { ScheduleContext } from "../../rendering/schedule-context";
import type { Midi, MidiAudio, NoteContext } from "../node";
import { Node } from "../node";

export class NoiseNode extends Node<Midi, MidiAudio> {
	readonly id = undefined;

	constructor(
		private readonly color: "white" | "pink" | "brown",
		private readonly seed: number | undefined,
	) {
		super();
	}

	setup(_context: ScheduleContext): void {
		return;
	}

	prepare(_note: NoteContext, _context: ScheduleContext): void {
		return;
	}

	schedule(noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const noiseNode = new AudioWorkletNode(scheduleContext.audioContext, "noise-processor", {
			processorOptions: { color: this.color, seed: this.seed },
		});

		const gate = scheduleContext.audioContext.createGain();

		gate.gain.setValueAtTime(0, 0);
		gate.gain.setValueAtTime(1, noteContext.startTime);
		gate.gain.setValueAtTime(0, noteContext.cleanupTime);

		noiseNode.connect(gate);

		if (this.outputs.length === 0) {
			gate.connect(scheduleContext.audioContext.destination);
		} else {
			for (const output of this.outputs) {
				output.schedule(gate, noteContext, scheduleContext);
			}
		}

		const isOffline = scheduleContext.audioContext instanceof OfflineAudioContext;

		if (!isOffline) {
			const cleanupDelay = (noteContext.cleanupTime - scheduleContext.audioContext.currentTime) * 1000;

			setTimeout(
				() => {
					gate.disconnect();
					noiseNode.disconnect();
				},
				Math.max(0, cleanupDelay),
			);
		}
	}

	teardown(_context: ScheduleContext): void {
		return;
	}
}

export function noise({ color = "white", seed }: { color?: "white" | "pink" | "brown"; seed?: number } = {}): NoiseNode {
	return new NoiseNode(color, seed);
}
