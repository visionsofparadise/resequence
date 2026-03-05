import { createUnitContext } from "../context";
import type { MidiUnit } from "../midi-unit";
import { parseMidiFile } from "../midi/parse-midi";

export interface RenderAudioOptions {
	readonly midi: Uint8Array;
	readonly unit: MidiUnit;
	readonly audioContext: OfflineAudioContext;
	readonly getSample: (path: string) => Promise<AudioBuffer>;
	readonly loadModule: (url: string) => Promise<void>;
}

export async function renderAudio(options: RenderAudioOptions): Promise<AudioBuffer> {
	const { midi, unit, audioContext, getSample, loadModule } = options;

	const notes = parseMidiFile(midi);
	const context = createUnitContext(audioContext, getSample, loadModule);

	await unit.setup(context);

	for (const note of notes) {
		unit.schedule(note, context);
	}

	const audioBuffer = await audioContext.startRendering();

	unit.teardown(context);

	return audioBuffer;
}
