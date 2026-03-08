import type { MarkerPoint, RegionPoint, TempoMap } from "@resequence/patterns";
import { beatsToSeconds } from "@resequence/patterns";
import type { WavBitDepth } from "@resequence/sync-units";
import { WaveFile } from "wavefile";

export function encodeWav(buffer: AudioBuffer, markers?: ReadonlyArray<MarkerPoint>, tempoMap?: TempoMap, regions?: ReadonlyArray<RegionPoint>, bitDepth?: WavBitDepth): ArrayBuffer {
	const channels: Array<Float32Array> = [];

	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		channels.push(buffer.getChannelData(channel));
	}

	const wav = new WaveFile();
	const targetBitDepth = bitDepth ?? "24";

	wav.fromScratch(buffer.numberOfChannels, buffer.sampleRate, "32f", channels);

	if (targetBitDepth !== "32f") {
		wav.toBitDepth(targetBitDepth);
	}

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
