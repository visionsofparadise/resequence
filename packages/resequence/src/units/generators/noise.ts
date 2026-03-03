import type { ScheduleContext } from "../../rendering/schedule-context";
import type { VoiceNote } from "../midi-unit";
import type { SetupResult } from "../unit";
import { GeneratorUnit, type GeneratorUnitInput, type GeneratorUnitProperties } from "./generator";

export interface NoiseProperties extends GeneratorUnitProperties {
	readonly color?: "white" | "pink" | "brown";
	readonly seed?: number;
}

export class NoiseUnit extends GeneratorUnit {
	readonly type = ["unit", "midi", "generator", "noise"] as const;
	readonly properties: NoiseProperties;

	static is(value: unknown): value is NoiseUnit {
		return GeneratorUnit.is(value) && value.type[3] === "noise";
	}

	constructor(properties?: GeneratorUnitInput<NoiseProperties>) {
		super(properties);
		this.properties = {
			...properties,
			targets: properties?.targets ?? [],
			modDeclarations: properties?.modDeclarations ?? [],
			noteModDeclarations: properties?.noteModDeclarations ?? [],
			voiceToCallbacks: properties?.voiceToCallbacks ?? [],
			voiceModDeclarations: properties?.voiceModDeclarations ?? [],
			color: properties?.color ?? "white",
		};
	}

	get color(): "white" | "pink" | "brown" { return this.properties.color ?? "white"; }
	get seed(): number | undefined { return this.properties.seed; }

	clone(overrides?: Partial<NoiseProperties>): NoiseUnit {
		return new NoiseUnit({ ...this.properties, ...overrides });
	}

	protected async _setup(context: ScheduleContext): Promise<SetupResult> {
		await context.loadModule(new URL("./noise-processor.js", import.meta.url).href);
		return super._setup(context);
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
