import type { OutputDescriptor } from "../hooks/useOutputs";

interface ChannelStripProps {
	readonly output: OutputDescriptor;
	readonly isActive: boolean;
	readonly onSelect: (outputId: string) => void;
}

export const ChannelStrip: React.FC<ChannelStripProps> = ({ output, isActive, onSelect }) => (
	<button
		type="button"
		className={`flex w-full flex-col gap-1 rounded-md px-3 py-2 text-left transition-colors ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
		onClick={() => onSelect(output.id)}
	>
		<div className="flex items-center justify-between">
			<span className="truncate text-xs font-medium">{output.label}</span>
			<div className="flex shrink-0 gap-1">
				<span className="rounded border border-zinc-700 px-1 text-[10px] text-zinc-500">M</span>
				<span className="rounded border border-zinc-700 px-1 text-[10px] text-zinc-500">S</span>
			</div>
		</div>
		<div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
			<div className="h-full w-1/3 rounded-full bg-green-500/60" />
		</div>
	</button>
);
