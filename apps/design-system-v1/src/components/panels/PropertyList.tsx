import { Content, Root, Trigger } from "@radix-ui/react-collapsible";
import { ChevronRight } from "lucide-react";
import { type ReactNode, useState } from "react";
import { RotaryKnob } from "@/components/daw/RotaryKnob";
import { Input } from "@/components/ui/Input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/Select";
import { ToggleButton } from "@/components/ui/ToggleButton";
import { cn } from "@/utils/cn";

interface KnobItemConfig {
  label: string;
  type: "knob";
  value: number;
  onChange: (value: number) => void;
  bipolar?: boolean;
}

interface InputItemConfig {
  label: string;
  type: "input";
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
}

interface SelectItemConfig {
  label: string;
  type: "select";
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}

interface ToggleItemConfig {
  label: string;
  type: "toggle";
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
}

type PropertyItemConfig =
  | KnobItemConfig
  | InputItemConfig
  | SelectItemConfig
  | ToggleItemConfig;

interface PropertyGroupConfig {
  label: string;
  collapsed?: boolean;
  items: Array<PropertyItemConfig>;
}

interface PropertyListProps {
  groups: Array<PropertyGroupConfig>;
  className?: string;
}

function PropertyRow({
  item,
  index,
}: {
  item: PropertyItemConfig;
  index: number;
}) {
  const isOdd = index % 2 === 0;

  let control: ReactNode = null;

  switch (item.type) {
    case "knob":
      control = (
        <RotaryKnob
          value={item.value}
          onChange={item.onChange}
          size="small"
          bipolar={item.bipolar}
        />
      );
      break;

    case "input":
      control = (
        <Input
          className="w-[80px] py-[2px] text-right"
          value={item.value}
          onChange={(ev) => {
            item.onChange(ev.target.value);
          }}
        />
      );
      break;

    case "select":
      control = (
        <Select value={item.value} onValueChange={item.onChange}>
          <SelectTrigger className="w-[80px] py-[2px]">
            {item.options.find((op) => op.value === item.value)?.label ??
              item.value}
          </SelectTrigger>
          <SelectContent>
            {item.options.map((op) => (
              <SelectItem key={op.value} value={op.value}>
                {op.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
      break;

    case "toggle":
      control = (
        <ToggleButton
          pressed={item.pressed}
          onPressedChange={item.onPressedChange}
          ledColor="gold"
          style={{ padding: "2px 8px", fontSize: "0.625rem" }}
        >
          {item.pressed ? "On" : "Off"}
        </ToggleButton>
      );
      break;
  }

  return (
    <div
      className={cn(
        "flex min-h-[36px] items-center justify-between px-[8px] py-[6px] hover:bg-surface-1",
        isOdd ? "bg-surface-1" : "bg-transparent",
      )}
    >
      <span className="label-caps font-mono text-text-secondary">
        {item.label}
      </span>
      <div className="flex items-center">{control}</div>
    </div>
  );
}

function PropertyGroup({ group }: { group: PropertyGroupConfig }) {
  const [open, setOpen] = useState(!group.collapsed);

  return (
    <Root open={open} onOpenChange={setOpen}>
      <Trigger className="flex w-full items-center gap-[4px] px-[8px] py-[4px] text-left hover:bg-surface-1">
        <ChevronRight
          className={cn(
            "h-[10px] w-[10px] text-text-tertiary transition-transform duration-150",
            open && "rotate-90",
          )}
        />
        <span className="font-mono text-[0.8125rem] leading-[1.125rem] font-medium text-text-primary">
          {group.label}
        </span>
      </Trigger>
      <Content>
        {group.items.map((item, index) => (
          <PropertyRow key={item.label} item={item} index={index} />
        ))}
      </Content>
    </Root>
  );
}

export function PropertyList({ groups, className }: PropertyListProps) {
  return (
    <div
      className={cn(
        "rounded-[4px] border border-border-default bg-surface-0",
        className,
      )}
    >
      {groups.map((group) => (
        <PropertyGroup key={group.label} group={group} />
      ))}
    </div>
  );
}
