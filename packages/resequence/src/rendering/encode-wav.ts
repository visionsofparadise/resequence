import { WaveFile } from "wavefile";
import type { MarkerPoint } from "./pattern-metadata";
import type { RegionPoint } from "./pattern-metadata";
import type { TempoMap } from "./tempo-map";
import { beatsToSeconds } from "./tempo-map";

export type WavBitDepth = "16" | "24" | "32" | "32f" | "64";

export function encodeWav(buffer: AudioBuffer, markers?: ReadonlyArray<MarkerPoint>, tempoMap?: TempoMap, regions?: ReadonlyArray<RegionPoint>, bitDepth?: WavBitDepth): ArrayBuffer {
	const channels: Array<Float32Array> = [];

	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		channels.push(buffer.getChannelData(channel));
	}

	const wav = new WaveFile();
	wav.fromScratch(buffer.numberOfChannels, buffer.sampleRate, bitDepth ?? "24", channels);

	if (markers && markers.length > 0 && tempoMap) {
		for (const markerPoint of markers) {
			const positionMs = beatsToSeconds(markerPoint.beat, tempoMap) * 1000;
			wav.setCuePoint({ position: positionMs, label: markerPoint.name });
		}
	}

	if (regions && regions.length > 0 && tempoMap) {
		for (const region of regions) {
			const startMs = beatsToSeconds(region.startBeat, tempoMap) * 1000;
			const endMs = beatsToSeconds(region.endBeat, tempoMap) * 1000;
			wav.setCuePoint({ position: startMs, label: region.name });
			wav.setCuePoint({ position: endMs, label: region.name });
		}
	}

	const bytes = wav.toBuffer();
	const result = new ArrayBuffer(bytes.byteLength);
	new Uint8Array(result).set(bytes);
	return result;
}
