import { useState } from "react";
import type { Pattern } from "resequence";

interface PatternsListProps {
	readonly pattern: Pattern;
	readonly depth: number;
	readonly defaultExpanded?: boolean;
}

const PatternsList: React.FC<PatternsListProps> = ({ pattern, depth, defaultExpanded = false }) => {
	const [expanded, setExpanded] = useState(defaultExpanded);
	const hasChildren = pattern.children.length > 0;
	const label = pattern.type[pattern.type.length - 1] ?? "pattern";

	return (
		<li>
			<button
				type="button"
				className="flex w-full items-center gap-1 rounded px-2 py-0.5 text-left text-sm hover:bg-accent/50"
				style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
				onClick={() => {
					if (hasChildren) setExpanded((prev) => !prev);
				}}
			>
				{hasChildren ? <span className="shrink-0 text-muted-foreground">{expanded ? "▾" : "▸"}</span> : <span className="shrink-0 text-muted-foreground">·</span>}
				<span className="truncate text-foreground">{label}</span>
			</button>
			{expanded && hasChildren && (
				<ul>
					{pattern.children.map(({ pattern: child }, index) => (
						<PatternsList
							key={index}
							pattern={child}
							depth={depth + 1}
						/>
					))}
				</ul>
			)}
		</li>
	);
};

interface PatternsPanelProps {
	readonly tree: Pattern | null;
}

export const PatternsPanel: React.FC<PatternsPanelProps> = ({ tree }) => {
	if (!tree) {
		return <p className="px-2 text-sm text-muted-foreground">No pattern tree</p>;
	}

	return (
		<ul>
			<PatternsList
				pattern={tree}
				depth={0}
				defaultExpanded={true}
			/>
		</ul>
	);
};
