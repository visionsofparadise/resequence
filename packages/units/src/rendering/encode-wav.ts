import { WaveFile } from "wavefile";

export type WavBitDepth = "16" | "24" | "32" | "32f" | "64";

export function encodeWav(buffer: AudioBuffer, bitDepth?: WavBitDepth): ArrayBuffer {
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

	const bytes = wav.toBuffer();
	const result = new ArrayBuffer(bytes.byteLength);

	new Uint8Array(result).set(bytes);

	return result;
}
