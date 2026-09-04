const CHROMATIC_BLACK_KEYS = new Set([1, 3, 6, 8, 10]);

interface PianoKeysProps {
	readonly keyHeight: number;
	readonly totalKeys?: number;
	readonly stepsPerOctave?: number;
}

export const PianoKeys: React.FC<PianoKeysProps> = ({ keyHeight, totalKeys = 120, stepsPerOctave = 12 }) => {
	const isChromatic = stepsPerOctave === 12;
	const maxPitch = totalKeys - 1;

	const keys: Array<React.ReactNode> = [];

	for (let row = 0; row < totalKeys; row++) {
		const pitch = maxPitch - row;
		const noteIndex = pitch % stepsPerOctave;
		const octave = Math.floor(pitch / stepsPerOctave);
		const isC = noteIndex === 0;
		const isBlack = isChromatic && CHROMATIC_BLACK_KEYS.has(noteIndex);
		const oddOctave = octave % 2 === 1;

		keys.push(
			<div
				key={pitch}
				className="flex items-center justify-between px-1 box-border relative"
				style={{
					height: keyHeight,
					backgroundColor: isBlack
						? "color-mix(in srgb, var(--color-surface) 70%, black 30%)"
						: oddOctave
							? "color-mix(in srgb, var(--color-elevated) 95%, var(--color-border) 5%)"
							: "var(--color-elevated)",
				}}
			>
				{isC && (
					<span className="type-label text-[8px] leading-none">{isChromatic ? `C${octave}` : `${octave}`}</span>
				)}
				{isBlack && <div className="absolute right-0 top-0 bottom-0 bg-dimmed opacity-40" style={{ width: 3 }} />}
			</div>,
		);
	}

	return (
		<div
			className="shrink-0 sticky left-0 z-10 border-r border-border"
			style={{ width: 48, height: totalKeys * keyHeight }}
		>
			{keys}
		</div>
	);
};
