import { ReactFlowProvider } from "@xyflow/react";
import type { BuildContext } from "../../../../models/Context";
import { useOutputs } from "../Router/hooks/useOutputs";
import { PianoRoll } from "./PianoRoll";
import { Timeline } from "./Timeline";
import { UnitGraph } from "./UnitGraph";

interface ActiveViewProps {
	readonly context: BuildContext;
	readonly goBack: () => void;
}

export const ActiveView: React.FC<ActiveViewProps> = ({ context, goBack }) => {
	const { project } = context;

	const outputs = useOutputs(context);

	if (project.activeOutput) {
		const output = outputs[project.activeOutput.index];

		if (output) {
			return (
				<ReactFlowProvider>
					<UnitGraph
						context={context}
						outputId={output.id}
						onBack={goBack}
					/>
				</ReactFlowProvider>
			);
		}
	}

	if (project.activePianoRoll) {
		return (
			<PianoRoll
				context={context}
				target={project.activePianoRoll}
				onBack={goBack}
			/>
		);
	}

	return <Timeline context={context} />;
};
