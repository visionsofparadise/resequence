import { useMemo, useRef, useState } from "react";
import { useTransients } from "../../../../../hooks/useTransients";
import type { BuildContext } from "../../../../../models/Context";
import type { Sequence } from "../../utils/buildArrangement";
import { AudioClipCard } from "./Clip/Audio/Card";
import { AutomationClipCard } from "./Clip/Automation/Card";
import { MidiClipCard } from "./Clip/Midi/Card";
import { MixerPopover } from "./MixerPopover";

interface SequenceCardProps {
	readonly sequence: Sequence;
	readonly sequencePath: Array<number>;
	readonly context: BuildContext;
}

export const SequenceCard: React.FC<SequenceCardProps> = ({ sequence, sequencePath, context }) => {
	const { project } = context;
	const containerRef = useRef<HTMLDivElement>(null);
	const [hovered, setHovered] = useState(false);

	const transients = useMemo(() => [project.timelineZoom], [project.timelineZoom]);

	useTransients(transients, () => {
		if (!containerRef.current) return;

		const pxPerBeat = project.timelineZoom.value;

		containerRef.current.style.left = `${sequence.startBeat * pxPerBeat}px`;
		containerRef.current.style.width = `${(sequence.endBeat - sequence.startBeat) * pxPerBeat}px`;
	});

	const channels = useMemo(() => {
		const seen = new Set<string>();
		const result: Array<{ name: string; color: string }> = [];

		for (const clip of sequence.clips) {
			if (clip.type !== "midi") continue;
			if (seen.has(clip.port)) continue;
			seen.add(clip.port);
			result.push({
				name: clip.port,
				color: context.portColorMap.get(clip.port) ?? "var(--color-text-secondary)",
			});
		}

		return result;
	}, [sequence.clips, context.portColorMap]);

	return (
		<div
			ref={containerRef}
			className="absolute top-0 border-r border-border diagonal-stripes"
		>
			<div
				className="relative flex flex-col"
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
			>
				{sequence.clips.map((clip, index) => {
					switch (clip.type) {
						case "midi":
							return (
								<MidiClipCard
									key={`note-${clip.port}-${index}`}
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
				{hovered && channels.length > 0 && (
					<div className="absolute left-0 top-0 -translate-y-full z-30">
						<MixerPopover channels={channels} />
					</div>
				)}
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
