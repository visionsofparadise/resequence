import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { Unit } from "resequence";
import type { Snapshot } from "valtio";
import type { StudioDriver } from "../../models/StudioDriver";
import { Knob } from "./Knob";

export interface UnitNodeData {
	readonly unit: Snapshot<Unit>;
	readonly drivers: Map<string, StudioDriver> | undefined;
}

export const UnitNode: React.FC<NodeProps> = ({ data }) => {
	const { unit, drivers } = data as unknown as UnitNodeData;

	const typeName = unit.type[unit.type.length - 1];

	if (!drivers) {
		return (
			<div className="rounded-lg bg-zinc-800 border border-zinc-700 p-3">
				<div className="text-xs font-medium text-zinc-300">{typeName}</div>
				<div className="animate-pulse bg-zinc-700/50 rounded h-10 mt-2" />
				<Handle
					type="target"
					position={Position.Left}
				/>
				<Handle
					type="source"
					position={Position.Right}
				/>
			</div>
		);
	}

	const knobs = Array.from(drivers.entries());

	return (
		<div className="rounded-lg bg-zinc-800 border border-zinc-700 p-3">
			<div className="text-xs font-medium text-zinc-300">{typeName}</div>

			{unit.id && <div className="text-[10px] text-zinc-500">{unit.id}</div>}

			{knobs.length > 0 && (
				<div className="flex gap-2 mt-2 nopan">
					{knobs.map(([name, driver]) => (
						<Knob
							key={name}
							label={name.split(".").pop() ?? name}
							driver={driver}
							range={driver.range ?? [0, 1]}
						/>
					))}
				</div>
			)}

			<Handle
				type="target"
				position={Position.Left}
			/>
			<Handle
				type="source"
				position={Position.Right}
			/>
		</div>
	);
};
