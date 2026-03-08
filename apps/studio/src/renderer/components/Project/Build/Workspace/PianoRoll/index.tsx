import { useEffect, useMemo, useRef } from "react";
import { useTransients } from "../../../../../hooks/useTransients";
import type { BuildContext } from "../../../../../models/Context";
import { Icon } from "../../../../ui/Icon";
import { Button } from "../../../../ui/button";
import type { MidiClip, Sequence } from "../../utils/buildArrangement";
import { outputColor } from "../../utils/outputColor";
import { PianoRollGrid } from "./Grid";
import { PianoRollNote } from "./Note";
import { PianoRollPitchSlide } from "./PitchSlide";

const NUM_OCTAVES = 11;

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

export const PianoRoll: React.FC<PianoRollProps> = ({ context, target, onBack }) => {
	const { project, arrangement, build } = context;
	const scrollRef = useRef<HTMLDivElement>(null);
	const contentRef = useRef<HTMLDivElement>(null);

	const resolved = useMemo(() => resolveTarget(arrangement.sequences, target), [arrangement, target]);

	const clip = resolved?.clip ?? null;
	const sequence = resolved?.sequence ?? null;

	const hoveredPattern = build.hoveredPattern;

	const stepsPerOctave = clip?.tuning ? clip.tuning.classes.length : 12;
	const timeSignature = clip?.timeSignature ?? ([4, 4] as const);
	const maxPitchKey = stepsPerOctave * NUM_OCTAVES - 1;
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
		if (!contentRef.current || !sequence) return;

		const pxPerBeat = project.timelineZoom.value;
		const pZoom = project.pitchZoom.value;
		const contentWidth = (sequence.endBeat - sequence.startBeat) * pxPerBeat;
		const contentHeight = (maxPitchKey - minPitchKey + 1) * pZoom;

		contentRef.current.style.width = `${contentWidth}px`;
		contentRef.current.style.height = `${contentHeight}px`;
	});

	if (!clip || !sequence) {
		return (
			<div className="flex h-full flex-col">
				<div className="shrink-0 px-3 py-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={onBack}
					>
						<Icon.ArrowLeft className="mr-1 h-3.5 w-3.5" />
						Back
					</Button>
				</div>
				<div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">Piano roll lane not found</div>
			</div>
		);
	}

	const pxPerBeat = project.timelineZoom.value;
	const color = outputColor(clip.port);

	return (
		<div className="flex h-full flex-col">
			<div className="flex shrink-0 items-center gap-2 border-b px-3 py-1.5">
				<Button
					variant="ghost"
					size="sm"
					onClick={onBack}
				>
					<Icon.ArrowLeft className="mr-1 h-3.5 w-3.5" />
					Back
				</Button>
				<span className="text-sm text-muted-foreground">{clip.port}</span>
			</div>

			<div
				ref={scrollRef}
				className="flex-1 overflow-auto"
				style={{ minHeight: 0 }}
			>
				<div
					ref={contentRef}
					className="relative"
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
								height: (maxPitchKey - minPitchKey + 1) * pitchZoom,
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
	);
};
