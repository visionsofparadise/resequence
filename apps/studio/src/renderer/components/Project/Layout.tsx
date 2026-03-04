import type { ProjectContext } from "../../models/Context";
import { Build } from "./Build";
import { Titlebar } from "./Titlebar";

interface LayoutProps {
	readonly context: ProjectContext;
}

export const Layout: React.FC<LayoutProps> = ({ context }) => {
	const { build } = context;

	return (
		<div className="flex h-screen flex-col">
			<Titlebar context={context} />
			<Build context={context} />
			{build.error && <div className="shrink-0 border-t border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive">{build.error}</div>}
		</div>
	);
};
