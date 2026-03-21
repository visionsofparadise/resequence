import { useState } from "react";
import { Handle, Position, type NodeProps, type Node } from "@xyflow/react";
import { cn } from "@/utils/cn";
import { RotaryKnob } from "@/components/daw/RotaryKnob";

interface KnobDef {
  label: string;
  value: number;
  bipolar?: boolean;
}

interface UnitNodeData {
  label: string;
  knobs?: Array<KnobDef>;
  sourceConnected?: boolean;
  targetConnected?: boolean;
  [key: string]: unknown;
}

type UnitNodeType = Node<UnitNodeData, "unit">;

function NodeKnobs({ defs }: { defs: Array<KnobDef> }) {
  const [values, setValues] = useState(() => defs.map((kn) => kn.value));

  const updateValue = (index: number, next: number) => {
    setValues((prev) => {
      const copy = [...prev];

      copy[index] = next;

      return copy;
    });
  };

  return (
    <div
      className="flex items-center justify-center gap-[6px] px-[8px] py-[6px]"
      onPointerDown={(ev) => {
        ev.stopPropagation();
      }}
    >
      {defs.map((kn, ix) => (
        <RotaryKnob
          key={kn.label}
          size="small"
          value={values[ix] ?? kn.value}
          onChange={(next) => updateValue(ix, next)}
          label={kn.label}
          bipolar={kn.bipolar}
        />
      ))}
    </div>
  );
}

export function UnitNode({ data, selected }: NodeProps<UnitNodeType>) {
  return (
    <div
      className={cn(
        "min-w-[120px] rounded-[4px] border border-border-default bg-surface-0",
        selected && "border-gold-500",
      )}
      style={{
        boxShadow: selected
          ? "var(--shadow-md), var(--gold-glow)"
          : "var(--shadow-md)",
      }}
    >
      <div
        className="h-[3px] rounded-t-[3px] bg-gold-500"
        aria-hidden="true"
      />

      <div className="bg-surface-1 px-[10px] py-[6px]">
        <span className="font-mono text-[0.75rem] leading-[1.125rem] text-text-primary">
          {data.label}
        </span>
      </div>

      {data.knobs !== undefined && data.knobs.length > 0 ? (
        <NodeKnobs defs={data.knobs} />
      ) : null}

      <Handle
        type="target"
        position={Position.Left}
        className={cn(
          "!h-[8px] !w-[8px] !rounded-full !border !border-border-strong",
          data.targetConnected ? "!bg-gold-500" : "!bg-surface-4",
        )}
      />

      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          "!h-[8px] !w-[8px] !rounded-full !border !border-border-strong",
          data.sourceConnected ? "!bg-gold-500" : "!bg-surface-4",
        )}
      />
    </div>
  );
}
