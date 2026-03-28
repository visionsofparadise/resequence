import type { NoteEvent, SetupResult, UnitContext } from "@resequence/web-au-core";

import { GeneratorUnit, type GeneratorUnitInput, type GeneratorUnitProperties } from "./generator";

export interface NoiseProperties extends GeneratorUnitProperties {
	readonly color?: "white" | "pink" | "brown";
	readonly seed?: number;
}

export class NoiseUnit extends GeneratorUnit {
	readonly type = ["unit", "midi", "generator", "noise"] as const;
	declare readonly properties: NoiseProperties;

	static override is(value: unknown): value is NoiseUnit {
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

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		await context.loadModule(new URL("../processors/noise-processor.js", import.meta.url).href);

		return super._setup(context);
	}

	protected override _schedule(noteEvent: NoteEvent, context: UnitContext): void {
		const ne = this.offsetNote(noteEvent, context);
		const noiseNode = new AudioWorkletNode(context.audioContext, "noise-processor", {
			processorOptions: { color: this.color, seed: this.seed },
		});

		const gate = context.audioContext.createGain();

		gate.gain.setValueAtTime(0, 0);
		gate.gain.setValueAtTime(1, ne.startMs / 1000);
		gate.gain.setValueAtTime(0, ne.cleanupMs / 1000);

		noiseNode.connect(gate);

		const cleanup = this.scheduleVoice([gate], ne, context);

		const cleanupDelay = ne.cleanupMs - context.audioContext.currentTime * 1000;

		setTimeout(
			() => {
				noiseNode.port.postMessage("stop");
				noiseNode.disconnect();
				cleanup();
			},
			Math.max(0, cleanupDelay),
		);
	}
}

export function noise({ color = "white", seed }: { color?: "white" | "pink" | "brown"; seed?: number } = {}): NoiseUnit {
	return new NoiseUnit({ color, seed });
}
