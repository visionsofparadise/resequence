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
			<div className="flex-1 min-h-0 overflow-hidden">
				<Build context={context} />
			</div>
			{build.error && (
				<div className="shrink-0 border-t border-accent-primary/20 bg-accent-primary/10 px-4 py-2 type-label text-accent-primary">
					{build.error}
				</div>
			)}
		</div>
	);
};
