import type { ProjectContext } from "../../../models/Context";
import { PatternsPanel } from "./PatternsPanel";
import { UnitsPanel } from "./UnitsPanel";

interface NodesPanelProps {
	readonly context: ProjectContext;
}

export const NodesPanel: React.FC<NodesPanelProps> = ({ context }) => {
	const { build } = context;

	return (
		<div className="flex h-full flex-col">
			<div className="flex min-h-0 flex-1 flex-col">
				<p className="sticky top-0 shrink-0 bg-background px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Patterns</p>
				<div className="flex-1 overflow-auto">
					<PatternsPanel tree={build.tree} />
				</div>
			</div>
			<div className="flex min-h-0 flex-1 flex-col border-t">
				<p className="sticky top-0 shrink-0 bg-background px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">Units</p>
				<div className="flex-1 overflow-auto">
					<UnitsPanel unitRoot={build.unitRoot} />
				</div>
			</div>
		</div>
	);
};
