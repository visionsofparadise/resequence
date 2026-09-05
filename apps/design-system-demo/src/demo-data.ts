export interface Note {
	beat: number;
	pitch: number;
	duration: number;
	velocity: number;
}

export interface AutomationPoint {
	beat: number;
	value: number;
}

export interface TreePattern {
	name: string;
	type: "sequence" | "layer" | "clip";
	clipType?: "midi" | "automation" | "audio";
	unitColor?: string;
	children?: Array<TreePattern>;
	notes?: Array<Note>;
	automation?: Array<AutomationPoint>;
	beats: number;
}

export const BEATS_PER_BAR = 4;
export const PIXELS_PER_BEAT = 48;
export const TOTAL_BARS = 24;

const generateDrumPattern = (bars: number): Array<Note> => {
	const notes: Array<Note> = [];

	for (let bar = 0; bar < bars; bar++) {
		const bt = bar * 4;

		notes.push({ beat: bt, pitch: 36, duration: 0.5, velocity: 120 });
		notes.push({ beat: bt + 2, pitch: 36, duration: 0.5, velocity: 110 });
		notes.push({ beat: bt + 1, pitch: 38, duration: 0.5, velocity: 100 });
		notes.push({ beat: bt + 3, pitch: 38, duration: 0.5, velocity: 105 });

		for (let hi = 0; hi < 8; hi++) {
			notes.push({
				beat: bt + hi * 0.5,
				pitch: 42,
				duration: 0.25,
				velocity: hi % 2 === 0 ? 90 : 70,
			});
		}

		if (bar % 4 === 3) {
			notes.push({ beat: bt + 3.5, pitch: 36, duration: 0.5, velocity: 80 });
		}

		if (bar % 2 === 1) {
			notes.push({ beat: bt + 2.5, pitch: 38, duration: 0.25, velocity: 60 });
		}
	}

	return notes;
};

const generateBuildingDrums = (bars: number): Array<Note> => {
	const notes: Array<Note> = [];

	for (let bar = 0; bar < bars; bar++) {
		const bt = bar * 4;
		const intensity = (bar + 1) / bars;

		notes.push({ beat: bt, pitch: 36, duration: 0.5, velocity: 80 + intensity * 40 });

		if (bar >= 2) {
			notes.push({ beat: bt + 2, pitch: 36, duration: 0.5, velocity: 70 + intensity * 30 });
		}

		const subdivs = bar < 2 ? 4 : 8;

		for (let hi = 0; hi < subdivs; hi++) {
			const step = 4 / subdivs;

			notes.push({
				beat: bt + hi * step,
				pitch: 42,
				duration: 0.25,
				velocity: 50 + intensity * 40,
			});
		}
	}

	return notes;
};

export const composition: TreePattern = {
	name: "SONG",
	type: "sequence",
	beats: 96,
	children: [
		{
			name: "INTRO",
			type: "sequence",
			beats: 16,
			children: [
				{
					name: "",
					type: "layer",
					beats: 16,
					children: [
						{
							name: "KEYS",
							type: "clip",
							clipType: "midi",
							unitColor: "var(--color-unit-1)",
							beats: 16,
							notes: [
								{ beat: 0, pitch: 60, duration: 8, velocity: 70 },
								{ beat: 0, pitch: 63, duration: 8, velocity: 65 },
								{ beat: 0, pitch: 67, duration: 8, velocity: 60 },
								{ beat: 8, pitch: 60, duration: 8, velocity: 75 },
								{ beat: 8, pitch: 63, duration: 8, velocity: 70 },
								{ beat: 8, pitch: 67, duration: 8, velocity: 65 },
							],
						},
						{
							name: "DRUMS",
							type: "clip",
							clipType: "midi",
							unitColor: "var(--color-unit-3)",
							beats: 16,
							notes: generateBuildingDrums(4),
						},
					],
				},
			],
		},

		{
			name: "VERSE",
			type: "sequence",
			beats: 32,
			children: [
				{
					name: "",
					type: "layer",
					beats: 32,
					children: [
						{
							name: "KEYS",
							type: "clip",
							clipType: "midi",
							unitColor: "var(--color-unit-1)",
							beats: 32,
							notes: [
								{ beat: 0, pitch: 60, duration: 16, velocity: 90 },
								{ beat: 0, pitch: 63, duration: 16, velocity: 85 },
								{ beat: 0, pitch: 67, duration: 16, velocity: 80 },
								{ beat: 16, pitch: 56, duration: 16, velocity: 88 },
								{ beat: 16, pitch: 60, duration: 16, velocity: 82 },
								{ beat: 16, pitch: 63, duration: 16, velocity: 78 },
							],
						},
						{
							name: "BASS",
							type: "clip",
							clipType: "midi",
							unitColor: "var(--color-unit-2)",
							beats: 32,
							notes: [
								{ beat: 0, pitch: 36, duration: 4, velocity: 110 },
								{ beat: 4, pitch: 36, duration: 2, velocity: 100 },
								{ beat: 6, pitch: 48, duration: 2, velocity: 95 },
								{ beat: 8, pitch: 36, duration: 4, velocity: 108 },
								{ beat: 12, pitch: 36, duration: 2, velocity: 100 },
								{ beat: 14, pitch: 43, duration: 2, velocity: 90 },
								{ beat: 16, pitch: 44, duration: 4, velocity: 105 },
								{ beat: 20, pitch: 44, duration: 2, velocity: 98 },
								{ beat: 22, pitch: 48, duration: 2, velocity: 92 },
								{ beat: 24, pitch: 44, duration: 4, velocity: 102 },
								{ beat: 28, pitch: 44, duration: 2, velocity: 96 },
								{ beat: 30, pitch: 41, duration: 2, velocity: 88 },
							],
						},
						{
							name: "DRUMS",
							type: "clip",
							clipType: "midi",
							unitColor: "var(--color-unit-3)",
							beats: 32,
							notes: generateDrumPattern(8),
						},
					],
				},
			],
		},

		{
			name: "CHORUS",
			type: "sequence",
			beats: 32,
			children: [
				{
					name: "CHORUS A",
					type: "sequence",
					beats: 16,
					children: [
						{
							name: "",
							type: "layer",
							beats: 16,
							children: [
								{
									name: "KEYS",
									type: "clip",
									clipType: "midi",
									unitColor: "var(--color-unit-1)",
									beats: 16,
									notes: [
										{ beat: 0, pitch: 58, duration: 8, velocity: 92 },
										{ beat: 0, pitch: 62, duration: 8, velocity: 86 },
										{ beat: 0, pitch: 65, duration: 8, velocity: 80 },
										{ beat: 8, pitch: 55, duration: 8, velocity: 95 },
										{ beat: 8, pitch: 59, duration: 8, velocity: 88 },
										{ beat: 8, pitch: 62, duration: 8, velocity: 82 },
									],
								},
								{
									name: "BASS",
									type: "clip",
									clipType: "midi",
									unitColor: "var(--color-unit-2)",
									beats: 16,
									notes: [
										{ beat: 0, pitch: 46, duration: 4, velocity: 110 },
										{ beat: 4, pitch: 46, duration: 2, velocity: 100 },
										{ beat: 6, pitch: 41, duration: 2, velocity: 95 },
										{ beat: 8, pitch: 43, duration: 4, velocity: 112 },
										{ beat: 12, pitch: 43, duration: 2, velocity: 100 },
										{ beat: 14, pitch: 36, duration: 2, velocity: 95 },
									],
								},
								{
									name: "DRUMS",
									type: "clip",
									clipType: "midi",
									unitColor: "var(--color-unit-3)",
									beats: 16,
									notes: generateDrumPattern(4),
								},
								{
									name: "FILTER",
									type: "clip",
									clipType: "automation",
									unitColor: "var(--color-unit-4)",
									beats: 16,
									automation: [
										{ beat: 0, value: 0.2 },
										{ beat: 4, value: 0.35 },
										{ beat: 8, value: 0.55 },
										{ beat: 12, value: 0.75 },
										{ beat: 16, value: 0.95 },
									],
								},
							],
						},
					],
				},

				{
					name: "CHORUS B",
					type: "sequence",
					beats: 16,
					children: [
						{
							name: "",
							type: "layer",
							beats: 16,
							children: [
								{
									name: "KEYS",
									type: "clip",
									clipType: "midi",
									unitColor: "var(--color-unit-1)",
									beats: 16,
									notes: [
										{ beat: 0, pitch: 58, duration: 2, velocity: 100 },
										{ beat: 0, pitch: 62, duration: 2, velocity: 90 },
										{ beat: 2, pitch: 65, duration: 2, velocity: 95 },
										{ beat: 2, pitch: 70, duration: 2, velocity: 88 },
										{ beat: 4, pitch: 60, duration: 2, velocity: 100 },
										{ beat: 4, pitch: 63, duration: 2, velocity: 92 },
										{ beat: 6, pitch: 67, duration: 2, velocity: 95 },
										{ beat: 6, pitch: 72, duration: 2, velocity: 100 },
										{ beat: 8, pitch: 55, duration: 8, velocity: 95 },
										{ beat: 8, pitch: 59, duration: 8, velocity: 88 },
										{ beat: 8, pitch: 62, duration: 8, velocity: 82 },
									],
								},
								{
									name: "BASS",
									type: "clip",
									clipType: "midi",
									unitColor: "var(--color-unit-2)",
									beats: 16,
									notes: [
										{ beat: 0, pitch: 46, duration: 2, velocity: 105 },
										{ beat: 2, pitch: 46, duration: 1, velocity: 100 },
										{ beat: 3, pitch: 41, duration: 1, velocity: 95 },
										{ beat: 4, pitch: 38, duration: 2, velocity: 100 },
										{ beat: 6, pitch: 36, duration: 2, velocity: 105 },
										{ beat: 8, pitch: 43, duration: 4, velocity: 110 },
										{ beat: 12, pitch: 43, duration: 4, velocity: 100 },
									],
								},
								{
									name: "DRUMS",
									type: "clip",
									clipType: "midi",
									unitColor: "var(--color-unit-3)",
									beats: 16,
									notes: generateDrumPattern(4),
								},
							],
						},
					],
				},
			],
		},

		{
			name: "OUTRO",
			type: "sequence",
			beats: 16,
			children: [
				{
					name: "",
					type: "layer",
					beats: 16,
					children: [
						{
							name: "KEYS",
							type: "clip",
							clipType: "midi",
							unitColor: "var(--color-unit-1)",
							beats: 16,
							notes: [
								{ beat: 0, pitch: 60, duration: 16, velocity: 70 },
								{ beat: 0, pitch: 63, duration: 16, velocity: 60 },
								{ beat: 0, pitch: 67, duration: 16, velocity: 50 },
							],
						},
						{
							name: "AMBIENCE",
							type: "clip",
							clipType: "audio",
							unitColor: "var(--color-unit-5)",
							beats: 16,
						},
					],
				},
			],
		},
	],
};
