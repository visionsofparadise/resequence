export interface WaveformBinary {
	readonly version: number;
	readonly channels: number;
	readonly sampleRate: number;
	readonly samplesPerPixel: number;
	readonly bits: 8 | 16;
	readonly length: number;
	readonly data: Int8Array | Int16Array;
}

const HEADER_SIZE_V1 = 20;
const HEADER_SIZE_V2 = 24;

export function parseWaveformBinary(buffer: Uint8Array): WaveformBinary {
	const normalizedBuffer = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
	const view = new DataView(normalizedBuffer.buffer, normalizedBuffer.byteOffset, normalizedBuffer.byteLength);

	const version = view.getInt32(0, true);
	const flags = view.getUint32(4, true);
	const sampleRate = view.getInt32(8, true);
	const samplesPerPixel = view.getInt32(12, true);
	const length = view.getUint32(16, true);

	const channels = version === 2 ? view.getInt32(20, true) : 1;
	const headerSize = version === 2 ? HEADER_SIZE_V2 : HEADER_SIZE_V1;

	const bits: 8 | 16 = (flags & 1) === 1 ? 8 : 16;

	const dataBuffer = normalizedBuffer.slice(headerSize).buffer;
	const data = bits === 8 ? new Int8Array(dataBuffer) : new Int16Array(dataBuffer);

	return { version, channels, sampleRate, samplesPerPixel, bits, length, data };
}
