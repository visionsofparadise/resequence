import { useMemo } from "react";
import type { BuildContext } from "../../../../models/Context";
import { ScrollArea } from "../../../ui/scroll-area";
import { useMuteSolo } from "./hooks/useMuteSolo";
import { Port } from "./Port";

interface PortsProps {
	readonly context: BuildContext;
}

export const Ports: React.FC<PortsProps> = ({ context }) => {
	const ports = useMemo(() => Array.from(context.source.ports), [context.source]);

	useMuteSolo(context);

	return (
		<div className="flex h-full flex-col">
			<div className="shrink-0 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground">Ports</div>
			{ports.length === 0 ? (
				<div className="flex flex-1 items-center justify-center">
					<p className="text-sm text-muted-foreground">No ports</p>
				</div>
			) : (
				<ScrollArea className="flex-1">
					<div className="space-y-1 px-2 pb-2">
						{ports.map(([portKey]) => (
							<Port
								key={portKey}
								portKey={portKey}
								context={context}
							/>
						))}
					</div>
				</ScrollArea>
			)}
		</div>
	);
};
