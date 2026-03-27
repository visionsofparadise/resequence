import { useEffect, useMemo, useRef } from "react";
import { useTransients } from "../../../../../hooks/useTransients";
import type { BuildContext } from "../../../../../models/Context";
import { ViewHeader } from "../../../../ViewHeader";
import type { MidiClip, Sequence } from "../../utils/buildArrangement";
import { PianoRollGrid } from "./Grid";
import { PianoRollNote } from "./Note";
import { PianoRollPitchSlide } from "./PitchSlide";
import { PianoKeys } from "./PianoKeys";

const NUM_OCTAVES = 11;
const PIANO_WIDTH = 48;
const RULER_HEIGHT = 24;

interface PianoRollTarget {
	readonly sequencePath: ReadonlyArray<number>;
	readonly index: number;
}

interface PianoRollProps {
	readonly context: BuildContext;
	readonly target: PianoRollTarget;
	readonly onBack: () => void;
}

interface ResolvedTarget {
	readonly clip: MidiClip;
	readonly sequence: Sequence;
}

function resolveTarget(sequences: ReadonlyArray<Sequence>, target: PianoRollTarget): ResolvedTarget | null {
	let current: ReadonlyArray<Sequence> = sequences;

	for (let si = 0; si < target.sequencePath.length; si++) {
		const index = target.sequencePath[si];

		if (index === undefined) return null;

		const segment = current[index];

		if (!segment) return null;

		if (si < target.sequencePath.length - 1) {
			current = segment.children;
		} else {
			const clip = segment.clips[target.index];

			if (clip?.type !== "midi") return null;

			return { clip, sequence: segment };
		}
	}

	return null;
}

const BeatRuler = ({ totalBars, beatsPerBar, pixelsPerBeat, height = 24 }: { totalBars: number; beatsPerBar: number; pixelsPerBeat: number; height?: number }) => {
	const totalBeats = totalBars * beatsPerBar;
	const totalWidth = totalBeats * pixelsPerBeat;
	const ticks: Array<{ x: number; height: number; label?: string }> = [];

	for (let ix = 0; ix <= totalBeats * 2; ix++) {
		const beat = ix / 2;
		const x = beat * pixelsPerBeat;

		if (x > totalWidth) break;

		const isBar = beat % beatsPerBar === 0 && ix % 2 === 0;
		const isBeat = ix % 2 === 0;

		let tickHeight = 6;
		let label: string | undefined;

		if (isBar) {
			tickHeight = 16;
			label = String(beat / beatsPerBar + 1);
		} else if (isBeat) {
			tickHeight = 10;
		}

		ticks.push({ x, height: tickHeight, label });
	}

	return (
		<div className="relative bg-surface shrink-0" style={{ width: totalWidth, height }}>
			{ticks.map((tick, ix) => (
				<div key={ix} className="absolute bottom-0" style={{ left: tick.x }}>
					<div className="bg-border" style={{ width: 1, height: tick.height }} />
					{tick.label && (
						<span className="type-label absolute whitespace-nowrap" style={{ left: 4, bottom: 8 }}>
							{tick.label}
						</span>
					)}
				</div>
			))}
		</div>
	);
};

export const PianoRoll: React.FC<PianoRollProps> = ({ context, target, onBack }) => {
	const { project, arrangement, build } = context;
	const scrollRef = useRef<HTMLDivElement>(null);
	const gridCellRef = useRef<HTMLDivElement>(null);

	const resolved = useMemo(() => resolveTarget(arrangement.sequences, target), [arrangement, target]);

	const clip = resolved?.clip ?? null;
	const sequence = resolved?.sequence ?? null;

	const hoveredPattern = build.hoveredPattern;

	const stepsPerOctave = clip?.tuning ? clip.tuning.classes.length : 12;
	const timeSignature = clip?.timeSignature ?? ([4, 4] as const);
	const totalKeys = stepsPerOctave * NUM_OCTAVES;
	const maxPitchKey = totalKeys - 1;
	const minPitchKey = 0;

	const pitchZoom = project.pitchZoom.value;

	useEffect(() => {
		if (!clip || !scrollRef.current) return;

		const container = scrollRef.current;
		const centerKey = (clip.minPitch + clip.maxPitch) / 2;
		const scrollTop = (maxPitchKey - centerKey) * pitchZoom - container.clientHeight / 2;

		container.scrollTop = Math.max(0, scrollTop);
	}, [clip, maxPitchKey, pitchZoom]);

	const transients = useMemo(() => [project.pitchZoom, project.timelineZoom], [project.pitchZoom, project.timelineZoom]);

	useTransients(transients, () => {
		if (!gridCellRef.current || !sequence) return;

		const pxPerBeat = project.timelineZoom.value;
		const pZoom = project.pitchZoom.value;
		const contentWidth = (sequence.endBeat - sequence.startBeat) * pxPerBeat;
		const contentHeight = (maxPitchKey - minPitchKey + 1) * pZoom;

		gridCellRef.current.style.width = `${contentWidth}px`;
		gridCellRef.current.style.height = `${contentHeight}px`;
	});

	if (!clip || !sequence) {
		return (
			<div className="flex h-full flex-col bg-surface">
				<ViewHeader title="PIANO ROLL" onClose={onBack} />
				<div className="flex flex-1 items-center justify-center text-sm text-text-secondary">
					Piano roll lane not found
				</div>
			</div>
		);
	}

	const pxPerBeat = project.timelineZoom.value;
	const color = context.portColorMap.get(clip.port) ?? "var(--color-text-secondary)";
	const totalBeats = sequence.endBeat - sequence.startBeat;
	const totalBars = Math.ceil(totalBeats / timeSignature[0]);
	const gridWidth = totalBeats * pxPerBeat;
	const gridHeight = totalKeys * pitchZoom;

	return (
		<div className="flex h-full flex-col bg-surface">
			<ViewHeader
				title={clip.port}
				unitColor={color}
				onClose={onBack}
			/>

			<div
				ref={scrollRef}
				className="flex-1 overflow-auto scrollbar-ruler"
				style={{ minHeight: 0 }}
			>
				<div
					style={{
						display: "grid",
						gridTemplateColumns: `${PIANO_WIDTH}px ${gridWidth}px`,
						gridTemplateRows: `${RULER_HEIGHT}px ${gridHeight}px`,
					}}
				>
					<div
						className="bg-surface border-b border-border"
						style={{ position: "sticky", top: 0, left: 0, zIndex: 3 }}
					/>

					<div
						className="border-b border-border"
						style={{ position: "sticky", top: 0, zIndex: 2 }}
					>
						<BeatRuler
							totalBars={totalBars}
							beatsPerBar={timeSignature[0]}
							pixelsPerBeat={pxPerBeat}
							height={RULER_HEIGHT}
						/>
					</div>

					<PianoKeys
						keyHeight={pitchZoom}
						totalKeys={totalKeys}
						stepsPerOctave={stepsPerOctave}
					/>

					<div
						ref={gridCellRef}
						className="relative"
						style={{ width: gridWidth, height: gridHeight }}
					>
						<PianoRollGrid
							minPitchKey={minPitchKey}
							maxPitchKey={maxPitchKey}
							stepsPerOctave={stepsPerOctave}
							timeSignature={timeSignature}
							startBeat={sequence.startBeat}
							endBeat={sequence.endBeat}
							context={context}
						/>

						{clip.notes.map((note, index) => (
							<PianoRollNote
								key={`n-${index}`}
								note={note}
								clip={clip}
								context={context}
							/>
						))}

						{clip.notes.map((noteData, ni) =>
							noteData.slides && noteData.slides.length > 0 ? (
								<PianoRollPitchSlide
									key={`s-${ni}`}
									note={noteData}
									clip={clip}
									sequence={sequence}
									context={context}
								/>
							) : null,
						)}

						{clip.spans.map((span) => (
							<div
								key={`span-${span.patternId}-${span.startBeat}`}
								className="absolute top-0"
								style={{
									left: (span.startBeat - sequence.startBeat) * pxPerBeat,
									width: (span.endBeat - span.startBeat) * pxPerBeat,
									height: gridHeight,
									border: `1px solid ${color}`,
									opacity: hoveredPattern === null ? 0.3 : hoveredPattern === span.patternId ? 0.8 : 0.15,
									pointerEvents: "auto",
								}}
								onMouseEnter={() => {
									context.projectStore.mutate(build, (proxy) => {
										proxy.hoveredPattern = span.patternId;
									});
								}}
								onMouseLeave={() => {
									context.projectStore.mutate(build, (proxy) => {
										proxy.hoveredPattern = null;
									});
								}}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};
