import type { ScheduleContext } from "../../rendering/schedule-context";
import type { VoiceNote } from "../midi-unit";
import { GeneratorUnit } from "./generator";

export class NoiseUnit extends GeneratorUnit {
	public readonly id?: string;

	private readonly color: "white" | "pink" | "brown";
	private readonly seed: number | undefined;

	constructor({ color = "white", seed, id }: { color?: "white" | "pink" | "brown"; seed?: number; id?: string } = {}) {
		super();
		this.color = color;
		this.seed = seed;
		this.id = id;
	}

	protected _schedule(voiceNote: VoiceNote, scheduleContext: ScheduleContext): void {
		const noiseNode = new AudioWorkletNode(scheduleContext.audioContext, "noise-processor", {
			processorOptions: { color: this.color, seed: this.seed },
		});

		const gate = scheduleContext.audioContext.createGain();
		gate.gain.setValueAtTime(0, 0);
		gate.gain.setValueAtTime(1, voiceNote.startMs / 1000);
		gate.gain.setValueAtTime(0, voiceNote.cleanupMs / 1000);

		noiseNode.connect(gate);

		const cleanup = this.scheduleVoice([gate], voiceNote, scheduleContext);

		const isOffline = scheduleContext.audioContext instanceof OfflineAudioContext;

		if (!isOffline) {
			const cleanupDelay = voiceNote.cleanupMs - scheduleContext.audioContext.currentTime * 1000;

			setTimeout(
				() => {
					noiseNode.disconnect();
					cleanup();
				},
				Math.max(0, cleanupDelay),
			);
		}
	}
}

export function noise({ color = "white", seed }: { color?: "white" | "pink" | "brown"; seed?: number } = {}): NoiseUnit {
	return new NoiseUnit({ color, seed });
}
