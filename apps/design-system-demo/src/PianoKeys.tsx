const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const BLACK_KEYS = new Set([1, 3, 6, 8, 10]);
const TOTAL_KEYS = 120;

interface PianoKeysProps {
	keyHeight: number;
}

const PianoKeys = ({ keyHeight }: PianoKeysProps) => {
	const keys: Array<{ pitch: number; name: string; isBlack: boolean; octave: number }> = [];

	for (let pitch = 119; pitch >= 0; pitch--) {
		const noteIndex = pitch % 12;
		const octave = Math.floor(pitch / 12);

		keys.push({
			pitch,
			name: noteIndex === 0 ? `C${octave}` : (NOTE_NAMES[noteIndex] ?? ""),
			isBlack: BLACK_KEYS.has(noteIndex),
			octave,
		});
	}

	return (
		<div className="shrink-0" style={{ width: 48, height: TOTAL_KEYS * keyHeight }}>
			{keys.map(({ pitch, name, isBlack, octave }) => {
				const isC = pitch % 12 === 0;
				const oddOctave = octave % 2 === 1;

				return (
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
						{isC && <span className="type-label text-[8px] leading-none">{name}</span>}
						{isBlack && (
							<div className="absolute right-0 top-0 bottom-0 bg-dimmed opacity-40" style={{ width: 3 }} />
						)}
					</div>
				);
			})}
		</div>
	);
};

export default PianoKeys;
