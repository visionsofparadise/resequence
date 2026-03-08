import { createUnitContext } from "../context";
import type { Unit } from "../unit";

export interface ProcessAudioOptions {
	readonly audio: AudioBuffer;
	readonly unit: Unit;
	readonly audioContext: OfflineAudioContext;
	readonly getSample: (path: string) => Promise<AudioBuffer>;
	readonly loadModule: (url: string) => Promise<void>;
}

export async function processAudio(options: ProcessAudioOptions): Promise<AudioBuffer> {
	const { audio, unit, audioContext, getSample, loadModule } = options;

	const context = createUnitContext(audioContext, getSample, loadModule);

	await unit.setup(context);

	try {
		const source = audioContext.createBufferSource();
		source.buffer = audio;

		for (const entry of unit.entryNodes) {
			source.connect(entry);
		}

		source.start(0);

		return await audioContext.startRendering();
	} finally {
		unit.teardown(context);
	}
}
