import { beatsToSeconds } from "@resequence/patterns-utils";
import type { AudioEvent, PreloadAudioEvent } from "../constructs/audio";
import type { TempoMap } from "@resequence/patterns-utils";

export async function dispatchAudioSetup(
	event: PreloadAudioEvent,
	getSample: (path: string) => Promise<AudioBuffer>,
): Promise<AudioBuffer | undefined> {
	try {
		return await getSample(event.sampleKey);
	} catch {
		return undefined;
	}
}

export function dispatchAudioCue(
	event: AudioEvent,
	buffer: AudioBuffer,
	audioContext: BaseAudioContext,
	tempoMap: TempoMap,
	destination: AudioNode,
): void {
	const source = audioContext.createBufferSource();

	if (event.reversed) {
		source.buffer = copyReversed(buffer, audioContext);
	} else {
		source.buffer = buffer;
	}

	if (event.transposeSemitones !== 0) {
		source.playbackRate.value = 2 ** (event.transposeSemitones / 12);
	}

	const offsetSeconds = beatsToSeconds(event.absoluteBeat, tempoMap);
	const playFromSeconds = event.playFromBeats * (buffer.duration / event.durationBeats);
	const durationSeconds = beatsToSeconds(event.durationBeats, tempoMap);

	source.connect(destination);
	source.start(offsetSeconds, playFromSeconds);
	source.stop(offsetSeconds + durationSeconds);
}

function copyReversed(buffer: AudioBuffer, audioCtx: BaseAudioContext): AudioBuffer {
	const reversed = audioCtx.createBuffer(buffer.numberOfChannels, buffer.length, buffer.sampleRate);

	for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
		const original = buffer.getChannelData(channel);
		const output = reversed.getChannelData(channel);

		for (let sampleIdx = 0; sampleIdx < original.length; sampleIdx++) {
			output[sampleIdx] = original[original.length - 1 - sampleIdx] ?? 0;
		}
	}

	return reversed;
}
