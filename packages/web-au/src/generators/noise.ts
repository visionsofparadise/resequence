import type { NoteEvent, SetupResult, UnitContext, UnitInput } from "@resequence/web-au-core";
import { z } from "zod";
import { GeneratorUnit } from "./generator";

const noiseSchema = z.object({
	color: z.enum(["white", "pink", "brown"]).default("white").describe("Color"),
	seed: z.number().optional().describe("Seed"),
});

export class NoiseUnit extends GeneratorUnit<typeof noiseSchema> {
	readonly type = ["unit", "midi"];
	readonly packageName = "@resequence/web-au";
	readonly unitName = "noise";

	constructor(input: z.infer<typeof noiseSchema> & UnitInput) {
		super(input, noiseSchema);
	}

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		await context.loadModule(new URL("../processors/noise-processor.js", import.meta.url).href);

		return super._setup(context);
	}

	protected override _schedule(noteEvent: NoteEvent, context: UnitContext): void {
		const ne = this.offsetNote(noteEvent, context);
		const noiseNode = new AudioWorkletNode(context.audioContext, "noise-processor", {
			processorOptions: { color: this.parameters.color.value, seed: this.parameters.seed?.value },
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
