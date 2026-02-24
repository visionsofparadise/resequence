export const CC = {
	MODULATION: 1,
	VOLUME: 7,
	PAN: 10,
	EXPRESSION: 11,
	SUSTAIN: 64,
	RESONANCE: 71,
	RELEASE: 72,
	ATTACK: 73,
	CUTOFF: 74,
	REVERB: 91,
	CHORUS: 93,
} as const;

export type CCNumber = (typeof CC)[keyof typeof CC];
