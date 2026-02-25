import { WaveFile } from "wavefile";
import type { MarkerPoint } from "./collect-markers";
import type { TempoMap } from "./tempo-map";
import { beatsToSeconds } from "./tempo-map";

export function encodeWav(buffer: AudioBuffer, markers?: ReadonlyArray<MarkerPoint>, tempoMap?: TempoMap): ArrayBuffer {
	const channels: Array<Float32Array> = [];

	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		channels.push(buffer.getChannelData(channel));
	}

	const wav = new WaveFile();
	wav.fromScratch(buffer.numberOfChannels, buffer.sampleRate, "32f", channels);

	if (markers && markers.length > 0 && tempoMap) {
		for (const markerPoint of markers) {
			const positionMs = beatsToSeconds(markerPoint.beat, tempoMap) * 1000;
			wav.setCuePoint({ position: positionMs, label: markerPoint.name });
		}
	}

	const bytes = wav.toBuffer();
	const result = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(result).set(bytes);
	return result;
}
