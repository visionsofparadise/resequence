import { useMemo, useRef } from "react";
import { useTransients } from "../../../../../hooks/useTransients";
import type { BuildContext } from "../../../../../models/Context";
import type { Sequence } from "../../utils/buildArrangement";
import { AudioClipCard } from "./Clip/Audio/Card";
import { AutomationClipCard } from "./Clip/Automation/Card";
import { MidiClipCard } from "./Clip/Midi/Card";

interface SequenceCardProps {
	readonly sequence: Sequence;
	readonly sequencePath: Array<number>;
	readonly context: BuildContext;
}

export const SequenceCard: React.FC<SequenceCardProps> = ({ sequence, sequencePath, context }) => {
	const { project } = context;
	const containerRef = useRef<HTMLDivElement>(null);

	const transients = useMemo(() => [project.timelineZoom], [project.timelineZoom]);

	useTransients(transients, () => {
		if (!containerRef.current) return;

		const pxPerBeat = project.timelineZoom.value;

		containerRef.current.style.left = `${sequence.startBeat * pxPerBeat}px`;
		containerRef.current.style.width = `${(sequence.endBeat - sequence.startBeat) * pxPerBeat}px`;
	});

	return (
		<div
			ref={containerRef}
			className="absolute top-0 border-r border-border/50"
		>
			<div className="flex flex-col">
				{sequence.clips.map((clip, index) => {
					switch (clip.type) {
						case "midi":
							return (
								<MidiClipCard
									key={`note-${clip.outputKey}-${index}`}
									clip={clip}
									sequence={sequence}
									sequencePath={sequencePath}
									index={index}
									context={context}
								/>
							);
						case "audio":
							return (
								<AudioClipCard
									key={`audio-${clip.patternId}-${index}`}
									clip={clip}
									sequence={sequence}
									context={context}
								/>
							);
						case "automation":
							return (
								<AutomationClipCard
									key={`auto-${clip.patternId}-${index}`}
									clip={clip}
									sequence={sequence}
									context={context}
								/>
							);
					}
				})}
			</div>

			{sequence.children.map((child, childIndex) => (
				<SequenceCard
					key={`child-${child.startBeat}-${childIndex}`}
					sequence={child}
					sequencePath={[...sequencePath, childIndex]}
					context={context}
				/>
			))}
		</div>
	);
};
