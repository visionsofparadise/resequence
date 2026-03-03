import type { ProjectContext } from "../../../models/Context";
import { useBuilds } from "../hooks/useBuilds";

interface BuildsPanelProps {
	readonly context: ProjectContext;
}

export const BuildsPanel: React.FC<BuildsPanelProps> = ({ context }) => {
	const { projectStore, build } = context;

	const entries = useBuilds(context);

	if (entries.length === 0) {
		return <p className="text-sm text-muted-foreground">No builds yet</p>;
	}

	return (
		<ul className="space-y-1">
			{entries.map((entry) => {
				const isActive = build.buildPath === entry.buildPath;

				const label = new Date(entry.timestamp).toLocaleString(undefined, {
					month: "short",
					day: "numeric",
					hour: "2-digit",
					minute: "2-digit",
					second: "2-digit",
				});

				return (
					<li key={entry.buildPath}>
						<button
							type="button"
							className={`w-full rounded px-2 py-1 text-left text-sm ${isActive ? "bg-accent text-accent-foreground font-medium" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}
							onClick={() => {
								projectStore.mutate(build, (proxy) => Object.assign(proxy, { buildPath: entry.buildPath }));
							}}
						>
							{label}
						</button>
					</li>
				);
			})}
		</ul>
	);
};
