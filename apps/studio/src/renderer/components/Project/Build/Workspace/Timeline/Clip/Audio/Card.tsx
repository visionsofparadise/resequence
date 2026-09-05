import { useClipBounds } from "../hooks/useClipBounds";
import { AudioCanvas } from "./Canvas";
import { useWaveformData } from "./hooks/useWaveformData";
import type { BuildContext } from "../../../../../../../models/Context";
import type { AudioClip, Sequence } from "../../../../utils/buildArrangement";

const AUDIO_LANE_HEIGHT = 48;

interface AudioClipCardProps {
	readonly clip: AudioClip;
	readonly sequence: Sequence;
	readonly context: BuildContext;
}

export const AudioClipCard: React.FC<AudioClipCardProps> = ({ clip, sequence, context }) => {
	const { data: waveform, isLoading, error } = useWaveformData(clip.sampleKey, context);
	const innerRef = useClipBounds(clip, sequence, context);

	return (
		<div className="relative border-b border-border" style={{ height: AUDIO_LANE_HEIGHT }}>
			<div
				ref={innerRef}
				className="absolute top-0 overflow-hidden border border-border bg-surface"
				style={{ height: AUDIO_LANE_HEIGHT }}
			>
				{isLoading && <div className="absolute inset-0 animate-pulse bg-elevated/30" />}
				{error && !waveform && (
					<div className="flex h-full items-center px-1.5">
						<span className="type-label truncate">{clip.name}</span>
					</div>
				)}
				{waveform && <AudioCanvas clip={clip} context={context} waveform={waveform} />}
				<span className="type-label absolute left-1.5 top-0.5 truncate">{clip.name}</span>
			</div>
		</div>
	);
};
