export const PPQ = 480;

export function bars(count: number, timeSignature: readonly [number, number] = [4, 4]): number {
	return count * timeSignature[0] * (4 / timeSignature[1]);
}

export function ms(millis: number, bpm: number): number {
	return (millis / 1000) * (bpm / 60);
}

export function sec(seconds: number, bpm: number): number {
	return seconds * (bpm / 60);
}
