export interface NoteSlide {
	readonly timeMs: number;
	readonly cents: number;
	readonly curve: number;
}

export interface NoteEvent {
	readonly startMs: number;
	readonly stopMs: number;
	readonly cleanupMs: number;
	readonly note: number;
	readonly velocity: number;
	readonly bend: number;
	readonly frequency: number;
	readonly attack?: number;
	readonly release?: number;
	readonly sustain?: number;
	readonly cutoff?: number;
	readonly resonance?: number;
	readonly volume?: number;
	readonly expression?: number;
	readonly pan?: number;
	readonly chorus?: number;
	readonly reverb?: number;
	readonly slides?: ReadonlyArray<NoteSlide>;
	readonly cc?: Partial<Record<number, number>>;
}
