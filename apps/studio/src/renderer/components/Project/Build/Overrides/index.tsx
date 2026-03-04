import { ScrollArea } from "../../../ui/scroll-area";

export const Overrides: React.FC = () => (
	<div className="flex h-full flex-col">
		<div className="shrink-0 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground">Overrides</div>
		<ScrollArea className="flex-1">
			<div className="px-3 pb-2">
				<p className="text-sm text-muted-foreground">No active overrides</p>
			</div>
		</ScrollArea>
	</div>
);
