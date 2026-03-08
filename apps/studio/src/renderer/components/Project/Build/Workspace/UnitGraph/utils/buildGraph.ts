import type { Edge, Node } from "@xyflow/react";
import type { Unit } from "@resequence/sync-units";
import type { Snapshot } from "valtio";
import type { DerivedDriverMap } from "../../../utils/hijackDrivers";
import type { UnitNodeData } from "../UnitNode";

export interface GraphResult {
	nodes: Array<Node>;
	edges: Array<Edge>;
}

type UnitSnapshot = Snapshot<Unit>;

export function buildGraph(root: UnitSnapshot, derivedDrivers: DerivedDriverMap | null): GraphResult {
	const nodes: Array<Node> = [];
	const edges: Array<Edge> = [];
	const idMap = new Map<UnitSnapshot, string>();

	let autoIndex = 0;

	function resolveId(unit: UnitSnapshot): string {
		let id = idMap.get(unit);

		if (id === undefined) {
			id = unit.id ?? `unit-${autoIndex++}`;
			idMap.set(unit, id);
		}

		return id;
	}

	function visit(unit: UnitSnapshot): void {
		const unitId = resolveId(unit);

		if (nodes.some((node) => node.id === unitId)) return;

		nodes.push({
			id: unitId,
			type: "unit",
			position: { x: 0, y: 0 },
			data: {
				unit,
				drivers: derivedDrivers?.byUnit.get(unitId) ?? undefined,
			} satisfies UnitNodeData,
		});

		for (const target of unit.targets) {
			const targetId = resolveId(target);

			edges.push({
				id: `${unitId}-${targetId}`,
				source: unitId,
				target: targetId,
			});

			visit(target);
		}
	}

	visit(root);

	return { nodes, edges };
}
