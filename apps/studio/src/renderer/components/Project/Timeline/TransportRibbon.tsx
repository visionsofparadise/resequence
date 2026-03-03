import type { ProjectContext } from "../../../models/Context";
import type { ProjectState } from "../../../models/State/Project";
import { Icon } from "../../ui/Icon";
import { Button } from "../../ui/button";

interface TransportRibbonProps {
	readonly context: ProjectContext;
}

function formatBeatPosition(beat: number): string {
	const bar = Math.floor(beat / 4) + 1;
	const beatInBar = (beat % 4) + 1;
	return `${bar}:${beatInBar.toFixed(1)}`;
}

export const TransportRibbon: React.FC<TransportRibbonProps> = ({ context }) => {
	const { playback, project } = context;

	return (
		<div className="flex h-10 shrink-0 items-center border-t px-3">
			<div className="flex-1" />

			<div className="flex items-center gap-1">
				<Button variant="ghost" size="icon" className="h-7 w-7" disabled>
					<Icon.SkipBack className="h-3.5 w-3.5" />
				</Button>
				<Button variant="ghost" size="icon" className="h-7 w-7" disabled>
					<Icon.Play className="h-3.5 w-3.5" />
				</Button>
				<Button variant="ghost" size="icon" className="h-7 w-7" disabled>
					<Icon.Stop className="h-3.5 w-3.5" />
				</Button>
				<span className="ml-2 min-w-[4rem] text-center font-mono text-xs text-muted-foreground">
					{formatBeatPosition(playback.beat)}
				</span>
			</div>

			<div className="flex flex-1 items-center justify-end gap-3">
				<div className="flex items-center gap-1">
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={() => context.projectStore.mutate<ProjectState>(project, (state) => { state.pitchZoom.committed.value = state.pitchZoom.value - 1; })}
					>
						<Icon.Minus className="h-3 w-3" />
					</Button>
					<span className="min-w-[3.5rem] text-center text-xs text-muted-foreground">
						V: {Math.round(project.pitchZoom.value)}px
					</span>
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6"
						onClick={() => context.projectStore.mutate<ProjectState>(project, (state) => { state.pitchZoom.committed.value = state.pitchZoom.value + 1; })}
					>
						<Icon.Plus className="h-3 w-3" />
					</Button>
				</div>
				<span className="text-xs text-muted-foreground">
					{Math.round(project.timelineZoom.value)}px/beat
				</span>
			</div>
		</div>
	);
};
