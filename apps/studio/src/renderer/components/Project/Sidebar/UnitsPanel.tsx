import { useState } from "react";

interface UnitLike {
	readonly type: ReadonlyArray<string>;
	readonly id?: string;
	readonly targets: ReadonlyArray<UnitLike>;
}

interface UnitRootLike {
	readonly children: ReadonlyArray<UnitLike>;
}

interface UnitChainProps {
	readonly unit: UnitLike;
}

function collectChain(unit: UnitLike): Array<UnitLike> {
	const result: Array<UnitLike> = [];
	const visited = new Set<UnitLike>();

	function descend(current: UnitLike): void {
		for (const target of current.targets) {
			if (visited.has(target)) continue;
			visited.add(target);
			result.push(target);
			descend(target);
		}
	}

	descend(unit);
	return result;
}

const UnitChain: React.FC<UnitChainProps> = ({ unit }) => {
	const [expanded, setExpanded] = useState(false);
	const label = unit.type[unit.type.length - 1] ?? "unit";
	const displayLabel = unit.id ? `${label} · ${unit.id}` : label;
	const chain = expanded ? collectChain(unit) : null;

	return (
		<li>
			<button
				type="button"
				className="flex w-full items-center gap-1 rounded px-2 py-0.5 text-left text-sm hover:bg-accent/50"
				onClick={() => setExpanded((prev) => !prev)}
			>
				<span className="shrink-0 text-muted-foreground">{expanded ? "▾" : "▸"}</span>
				<span className="truncate text-foreground">{displayLabel}</span>
			</button>
			{expanded && chain && chain.length > 0 && (
				<ul>
					{chain.map((target, index) => {
						const targetLabel = target.type[target.type.length - 1] ?? "unit";
						const targetDisplay = target.id ? `${targetLabel} · ${target.id}` : targetLabel;
						return (
							<li
								key={index}
								className="flex items-center gap-1 rounded px-2 py-0.5 text-sm"
								style={{ paddingLeft: "1.5rem" }}
							>
								<span className="shrink-0 text-muted-foreground">·</span>
								<span className="truncate text-foreground">{targetDisplay}</span>
							</li>
						);
					})}
				</ul>
			)}
		</li>
	);
};

interface UnitsPanelProps {
	readonly unitRoot: UnitRootLike | null;
}

export const UnitsPanel: React.FC<UnitsPanelProps> = ({ unitRoot }) => {
	if (!unitRoot || unitRoot.children.length === 0) {
		return <p className="px-2 text-sm text-muted-foreground">No units</p>;
	}

	return (
		<ul>
			{unitRoot.children.map((unit, index) => (
				<UnitChain
					key={index}
					unit={unit}
				/>
			))}
		</ul>
	);
};
