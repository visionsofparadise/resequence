import { elevated, border } from "@resequence/design-system";
import type { BuildContext } from "../../../../../models/Context";

const CHROMATIC_BLACK_KEYS = new Set([1, 3, 6, 8, 10]);

interface PianoRollGridProps {
	readonly minPitchKey: number;
	readonly maxPitchKey: number;
	readonly stepsPerOctave: number;
	readonly timeSignature: readonly [number, number];
	readonly startBeat: number;
	readonly endBeat: number;
	readonly context: BuildContext;
}

export const PianoRollGrid: React.FC<PianoRollGridProps> = ({
	minPitchKey,
	maxPitchKey,
	stepsPerOctave,
	timeSignature,
	startBeat,
	endBeat,
	context,
}) => {
	const { project } = context;
	const pxPerBeat = project.timelineZoom.value;
	const pitchZoom = project.pitchZoom.value;

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
					backgroundColor: isBlack ? elevated : undefined,
					borderBottom: `1px solid ${border}`,
					borderBottomWidth: 1,
					opacity: isOctaveBoundary ? 1 : undefined,
					borderColor: isOctaveBoundary ? border : `color-mix(in srgb, ${border} 40%, transparent)`,
				}}
			/>,
		);
	}

	const beatLines: Array<React.ReactNode> = [];

	for (let beat = 0; beat <= totalBeats; beat++) {
		const absoluteBeat = startBeat + beat;
		const isBarLine = absoluteBeat % beatsPerBar === 0;

		beatLines.push(
			<div
				key={`beat-${beat}`}
				className="absolute top-0"
				style={{
					left: beat * pxPerBeat,
					width: 1,
					height,
					backgroundColor: border,
					opacity: isBarLine ? 0.6 : 0.25,
				}}
			/>,
		);
	}

	return (
		<div className="pointer-events-none absolute inset-0" style={{ width, height }}>
			{rows}
			{beatLines}
		</div>
	);
};
