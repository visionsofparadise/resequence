import { basename } from "pathe";
import type { ProjectContext } from "../../models/Context";
import { useProjectLoader } from "../../utils/projectLoader";
import { Button } from "../ui/button";
import { Icon } from "../ui/Icon";

interface TitlebarProps {
	readonly context: ProjectContext;
}

export const Titlebar: React.FC<TitlebarProps> = ({ context }) => {
	const { closeProject } = useProjectLoader(context);

	const projectName = basename(context.currentProjectPath);

	return (
		<div
			className="flex h-[44px] shrink-0 items-center px-4"
			style={{ appRegion: "drag" } as React.CSSProperties}
		>
			<Button
				variant="ghost"
				size="sm"
				className="gap-1"
				onClick={closeProject}
				style={{ appRegion: "no-drag" } as React.CSSProperties}
			>
				<Icon.ArrowLeft className="h-4 w-4" />
				Home
			</Button>
			<span className="flex-1 text-center text-sm font-medium">{projectName}</span>
			<div className="w-[68px]" />
		</div>
	);
};
