import { encodeWavFileFromArrays } from "wav-file-encoder";

export function encodeWav(buffer: AudioBuffer): ArrayBuffer {
	const channels: Array<Float32Array> = [];

	for (let ch = 0; ch < buffer.numberOfChannels; ch++) {
		channels.push(buffer.getChannelData(ch));
	}

	return encodeWavFileFromArrays(channels, buffer.sampleRate, 0);
}
