import { memo } from "react";
import { CHROMATIC_BLACK_KEYS } from "../Timeline/constants";

interface PianoRollGridProps {
	readonly minPitchKey: number;
	readonly maxPitchKey: number;
	readonly stepsPerOctave: number;
	readonly timeSignature: readonly [number, number];
	readonly startBeat: number;
	readonly endBeat: number;
	readonly pxPerBeat: number;
	readonly pitchZoom: number;
}

export const PianoRollGrid = memo<PianoRollGridProps>(
	({ minPitchKey, maxPitchKey, stepsPerOctave, timeSignature, startBeat, endBeat, pxPerBeat, pitchZoom }) => {
		const totalRows = maxPitchKey - minPitchKey + 1;
		const width = (endBeat - startBeat) * pxPerBeat;
		const height = totalRows * pitchZoom;
		const isChromatic = stepsPerOctave === 12;
		const beatsPerBar = timeSignature[0];
		const totalBeats = endBeat - startBeat;

		const rows: Array<React.ReactNode> = [];
		for (let pitchKey = maxPitchKey; pitchKey >= minPitchKey; pitchKey--) {
			const row = maxPitchKey - pitchKey;
			const isOctaveBoundary = pitchKey % stepsPerOctave === 0;
			const isBlack = isChromatic && CHROMATIC_BLACK_KEYS.has(pitchKey % 12);

			rows.push(
				<div
					key={`row-${pitchKey}`}
					className="absolute w-full"
					style={{
						top: row * pitchZoom,
						height: pitchZoom,
						backgroundColor: isBlack ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.06)",
						borderBottom: isOctaveBoundary ? "1px solid rgba(255,255,255,0.15)" : "1px solid rgba(255,255,255,0.04)",
					}}
				/>,
			);

			if (isOctaveBoundary) {
				const octaveNumber = Math.floor(pitchKey / stepsPerOctave);
				rows.push(
					<span
						key={`oct-${pitchKey}`}
						className="pointer-events-none absolute left-0.5 text-[8px] text-muted-foreground/50"
						style={{ top: row * pitchZoom }}
					>
						{octaveNumber}
					</span>,
				);
			}
		}

		const beatLines: Array<React.ReactNode> = [];
		for (let beat = 0; beat <= totalBeats; beat++) {
			const isBarLine = beat % beatsPerBar === 0;
			beatLines.push(
				<div
					key={`beat-${beat}`}
					className="absolute top-0"
					style={{
						left: beat * pxPerBeat,
						width: 1,
						height,
						backgroundColor: isBarLine ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)",
					}}
				/>,
			);

			if (isBarLine) {
				const barNumber = Math.floor(beat / beatsPerBar) + 1;
				beatLines.push(
					<span
						key={`bar-${beat}`}
						className="pointer-events-none absolute text-[8px] text-muted-foreground/50"
						style={{ left: beat * pxPerBeat + 2, top: 0 }}
					>
						{barNumber}
					</span>,
				);
			}
		}

		return (
			<div className="pointer-events-none absolute inset-0" style={{ width, height }}>
				{rows}
				{beatLines}
			</div>
		);
	},
);
