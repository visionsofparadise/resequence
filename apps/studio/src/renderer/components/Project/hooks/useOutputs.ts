import { useMemo } from "react";
import type { Unit } from "resequence";
import type { Snapshot } from "valtio";
import type { ProjectContext } from "../../../models/Context";

export interface OutputDescriptor {
	readonly id: string;
	readonly label: string;
	readonly unit: Snapshot<Unit>;
}

export function useOutputs(context: ProjectContext): ReadonlyArray<OutputDescriptor> {
	const { build } = context;
	const unitRoot = build.unitRoot;

	return useMemo(() => {
		if (!unitRoot) return [];

		return unitRoot.children.map((unit, index) => {
			const typeName = unit.type[unit.type.length - 1] ?? "unit";
			const id = unit.id ?? String(index);
			const label = unit.id ? `${typeName} · ${unit.id}` : typeName;

			return { id, label, unit };
		});
	}, [unitRoot]);
}
