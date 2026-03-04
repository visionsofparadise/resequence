import { useMemo, useRef } from "react";
import { useTransients } from "../../../../../../../hooks/useTransients";
import type { BuildContext } from "../../../../../../../models/Context";
import type { AudioClip, Sequence } from "../../../../utils/buildArrangement";
import { AudioCanvas } from "./Canvas";
import { useWaveformData } from "./hooks/useWaveformData";

const AUDIO_LANE_HEIGHT = 48;

interface AudioClipCardProps {
	readonly clip: AudioClip;
	readonly sequence: Sequence;
	readonly context: BuildContext;
}

export const AudioClipCard: React.FC<AudioClipCardProps> = ({ clip, sequence, context }) => {
	const { project } = context;
	const innerRef = useRef<HTMLDivElement>(null);
	const { data: waveform, isLoading, error } = useWaveformData(clip.filePath, context);

	const transients = useMemo(() => [project.timelineZoom], [project.timelineZoom]);

	useTransients(transients, () => {
		if (!innerRef.current) return;

		const pxPerBeat = project.timelineZoom.value;
		const left = (clip.startBeat - sequence.startBeat) * pxPerBeat;
		const width = (clip.endBeat - clip.startBeat) * pxPerBeat;

		innerRef.current.style.left = `${left}px`;
		innerRef.current.style.width = `${width}px`;
	});

	return (
		<div
			className="relative border-b border-border"
			style={{ height: AUDIO_LANE_HEIGHT }}
		>
			<div
				ref={innerRef}
				className="absolute top-0 overflow-hidden rounded-sm border border-muted-foreground/30 bg-muted/50"
				style={{ height: AUDIO_LANE_HEIGHT }}
			>
				{isLoading && <div className="absolute inset-0 animate-pulse bg-muted/30" />}
				{error && !waveform && (
					<div className="flex h-full items-center px-1.5">
						<span className="truncate text-[10px] text-muted-foreground">{clip.name}</span>
					</div>
				)}
				{waveform && <AudioCanvas clip={clip} context={context} waveform={waveform} />}
				<span className="absolute left-1.5 top-0.5 truncate text-[10px] text-muted-foreground drop-shadow-sm">{clip.name}</span>
			</div>
		</div>
	);
};
