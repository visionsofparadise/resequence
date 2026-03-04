import type { BuildContext } from "../../../../models/Context";
import { ScrollArea } from "../../../ui/scroll-area";
import { useOutputs } from "./hooks/useOutputs";
import { Output } from "./Output";

interface RouterProps {
	readonly context: BuildContext;
}

export const Router: React.FC<RouterProps> = ({ context }) => {
	const outputs = useOutputs(context);

	return (
		<div className="flex h-full flex-col">
			<div className="shrink-0 px-3 py-2 text-xs uppercase tracking-wide text-muted-foreground">Outputs</div>
			{outputs.length === 0 ? (
				<div className="flex flex-1 items-center justify-center">
					<p className="text-sm text-muted-foreground">No outputs</p>
				</div>
			) : (
				<ScrollArea className="flex-1">
					<div className="space-y-1 px-2 pb-2">
						{outputs.map((output, index) => (
							<Output
								key={output.id}
								output={output}
								index={index}
								context={context}
							/>
						))}
					</div>
				</ScrollArea>
			)}
		</div>
	);
};
