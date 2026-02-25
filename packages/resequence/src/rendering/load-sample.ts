import { WaveFile } from "wavefile";

interface CuePoint {
	readonly label: string;
	readonly dwSampleOffset: number;
}

export async function loadSample(
	key: string,
	audioContext: BaseAudioContext,
	fetchBuffer: (path: string) => Promise<ArrayBuffer>,
): Promise<AudioBuffer> {
	const hashIndex = key.indexOf("#");

	if (hashIndex === -1) {
		const bytes = await fetchBuffer(key);
		return audioContext.decodeAudioData(bytes);
	}

	const filePath = key.slice(0, hashIndex);
	const regionName = key.slice(hashIndex + 1);

	const bytes = await fetchBuffer(filePath);

	const wav = new WaveFile(new Uint8Array(bytes));
	const cuePoints = wav.listCuePoints() as Array<CuePoint>;

	const regionIndex = cuePoints.findIndex((pt) => pt.label === regionName);

	const fullBuffer = await audioContext.decodeAudioData(bytes.slice(0));

	if (regionIndex === -1) return fullBuffer;

	const startFrame = cuePoints[regionIndex]?.dwSampleOffset ?? 0;
	const nextPoint = cuePoints[regionIndex + 1];
	const endFrame = nextPoint !== undefined ? nextPoint.dwSampleOffset : fullBuffer.length;

	const regionLength = endFrame - startFrame;
	const regionBuffer = audioContext.createBuffer(fullBuffer.numberOfChannels, regionLength, fullBuffer.sampleRate);

	for (let channel = 0; channel < fullBuffer.numberOfChannels; channel++) {
		const source = fullBuffer.getChannelData(channel);
		const dest = regionBuffer.getChannelData(channel);
		dest.set(source.subarray(startFrame, endFrame));
	}

	return regionBuffer;
}
