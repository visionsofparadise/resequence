import { Handle, Position, type NodeProps } from "@xyflow/react";
import { useEffect, useState, useCallback } from "react";
import type { Unit } from "@resequence/web-au";
import type { Snapshot } from "valtio";
import { Knob } from "@resequence/design-system";
import type { StudioDriver } from "../../models/StudioDriver";

export interface UnitNodeData {
	readonly unit: Snapshot<Unit>;
	readonly drivers: Map<string, StudioDriver> | undefined;
}

const PORT_SIZE = 8;

const DriverKnob: React.FC<{ name: string; driver: StudioDriver }> = ({ name, driver }) => {
	const [normalized, setNormalized] = useState(0);
	const range = driver.range ?? [0, 1];
	const [min, max] = range;

	useEffect(() => driver.subscribe((raw) => {
		const norm = max !== min ? (raw - min) / (max - min) : 0;

		setNormalized(Math.max(0, Math.min(1, norm)));
	}), [driver, min, max]);

	const onChange = useCallback((normalized01: number) => {
		const raw = normalized01 * (max - min) + min;

		driver.offset.value = raw;
	}, [driver, min, max]);

	return (
		<Knob
			value={normalized}
			label={name.split(".").pop() ?? name}
			size={28}
			onChange={onChange}
		/>
	);
};

export const UnitNode: React.FC<NodeProps> = ({ data }) => {
	const { unit, drivers } = data as unknown as UnitNodeData;
	const typeName = unit.type[unit.type.length - 1];

	if (!drivers) {
		return (
			<div className="bg-elevated border border-border p-3 w-[200px] relative">
				<span className="type-label">{typeName}</span>
				<div className="animate-pulse bg-border/50 h-10 mt-2" />
				<Handle type="target" position={Position.Left} style={{ width: PORT_SIZE, height: PORT_SIZE, background: "var(--color-dimmed)" }} />
				<Handle type="source" position={Position.Right} style={{ width: PORT_SIZE, height: PORT_SIZE, background: "var(--color-dimmed)" }} />
			</div>
		);
	}

	const entries = Array.from(drivers.entries());

	return (
		<div className="bg-elevated border border-border p-3 w-[200px] relative">
			<div className="flex items-start justify-between mb-3">
				<span className="type-display text-[16px]">{typeName}</span>
				<div className="flex flex-col">
					<button className="type-label text-dimmed hover:text-text-primary transition-colors bg-transparent border-none p-0 cursor-pointer leading-none">BYP</button>
					<button className="type-label text-dimmed hover:text-text-primary transition-colors bg-transparent border-none p-0 cursor-pointer leading-none">RST</button>
				</div>
			</div>

			{entries.length > 0 && (
				<div className="flex flex-wrap gap-2 nopan">
					{entries.map(([name, driver]) => (
						<DriverKnob key={name} name={name} driver={driver} />
					))}
				</div>
			)}

			<Handle
				type="target"
				position={Position.Left}
				style={{ width: PORT_SIZE, height: PORT_SIZE, background: "var(--color-dimmed)" }}
			/>
			<Handle
				type="source"
				position={Position.Right}
				style={{ width: PORT_SIZE, height: PORT_SIZE, background: "var(--color-dimmed)" }}
			/>
		</div>
	);
};
