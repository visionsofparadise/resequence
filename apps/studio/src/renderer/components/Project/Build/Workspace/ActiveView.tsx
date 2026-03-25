import type { BuildContext } from "../../../../models/Context";
import { PianoRoll } from "./PianoRoll";
import { Timeline } from "./Timeline";
import { UnitGraph } from "./UnitGraph";

interface ActiveViewProps {
	readonly context: BuildContext;
	readonly goBack: () => void;
}

export const ActiveView: React.FC<ActiveViewProps> = ({ context, goBack }) => {
	const { project } = context;

	if (project.activePort) {
		const unit = context.source.ports.get(project.activePort);

		if (unit) {
			return (
				<UnitGraph
					context={context}
					portKey={project.activePort}
					outputUnit={unit}
					onBack={goBack}
				/>
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
