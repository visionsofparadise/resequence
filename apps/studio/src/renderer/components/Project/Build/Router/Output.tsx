import { useCallback } from "react";
import { type Unit, AnalyserUnit } from "resequence";
import type { BuildContext } from "../../../../models/Context";
import type { ProjectState } from "../../../../models/State/Project";
import { Meter } from "./Meter";

interface OutputProps {
	readonly output: Unit;
	readonly index: number;
	readonly context: BuildContext;
}

export const Output: React.FC<OutputProps> = ({ output, index, context }) => {
	const { project, projectStore, injectedUnits } = context;

	const outputId = output.id ?? `output-${index}`;
	const isActive = project.activeOutput?.index === index;
	const isMuted = project.mutedOutputs.has(outputId);
	const isSoloed = project.soloedOutputs.has(outputId);

	const analyserKey = `system.${outputId}.router.analyser`;
	const analyserUnit = injectedUnits.get(analyserKey);
	const analyserNode = analyserUnit && AnalyserUnit.is(analyserUnit) ? analyserUnit.analyserNode : undefined;

	const onSelect = useCallback(() => {
		projectStore.mutate<ProjectState>(project, (proxy) => {
			proxy.activePianoRoll = null;
			proxy.activeOutput = { index };
		});
	}, [project, projectStore, index]);

	const onToggleMute = useCallback(
		(event: React.MouseEvent) => {
			event.stopPropagation();
			projectStore.mutate<ProjectState>(project, (proxy) => {
				if (proxy.mutedOutputs.has(outputId)) {
					proxy.mutedOutputs.delete(outputId);
				} else {
					proxy.mutedOutputs.add(outputId);
				}
			});
		},
		[project, projectStore, outputId],
	);

	const onToggleSolo = useCallback(
		(event: React.MouseEvent) => {
			event.stopPropagation();
			projectStore.mutate<ProjectState>(project, (proxy) => {
				if (proxy.soloedOutputs.has(outputId)) {
					proxy.soloedOutputs.delete(outputId);
				} else {
					proxy.soloedOutputs.add(outputId);
				}
			});
		},
		[project, projectStore, outputId],
	);

	return (
		<button
			type="button"
			className={`flex w-full flex-col gap-1 rounded-md px-3 py-2 text-left transition-colors ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
			onClick={onSelect}
		>
			<div className="flex items-center justify-between">
				<span className="truncate text-xs font-medium">{output.id ?? `Output ${index + 1}`}</span>
				<div className="flex shrink-0 gap-1">
					<span
						role="button"
						tabIndex={0}
						className={`rounded border px-1 text-[10px] cursor-pointer select-none ${isMuted ? "border-red-500 bg-red-500/20 text-red-400" : "border-zinc-700 text-zinc-500 hover:border-zinc-500"}`}
						onClick={onToggleMute}
						onKeyDown={(event) => event.key === "Enter" && onToggleMute(event as unknown as React.MouseEvent)}
					>
						M
					</span>
					<span
						role="button"
						tabIndex={0}
						className={`rounded border px-1 text-[10px] cursor-pointer select-none ${isSoloed ? "border-yellow-500 bg-yellow-500/20 text-yellow-400" : "border-zinc-700 text-zinc-500 hover:border-zinc-500"}`}
						onClick={onToggleSolo}
						onKeyDown={(event) => event.key === "Enter" && onToggleSolo(event as unknown as React.MouseEvent)}
					>
						S
					</span>
				</div>
			</div>
			<Meter analyserNode={analyserNode} />
		</button>
	);
};
