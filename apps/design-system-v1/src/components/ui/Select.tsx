import {
  Content,
  Icon,
  Item,
  ItemText,
  Portal,
  Root,
  Trigger,
  Value,
  Viewport,
} from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";
import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "@/utils/cn";

type SelectRootProps = ComponentPropsWithoutRef<typeof Root>;

function Select(props: SelectRootProps) {
  return <Root {...props} />;
}

const SelectTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof Trigger>
>(({ className, children, ...props }, ref) => (
  <Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-between gap-[8px] rounded-[4px] border border-border-default bg-surface-4 px-[8px] py-[4px] font-mono text-[0.75rem] leading-[1.125rem] text-text-primary focus:border-gold-500 focus:outline-none",
      className,
    )}
    style={{ boxShadow: "var(--shadow-inset-sm)" }}
    {...props}
  >
    <Value>{children}</Value>
    <Icon>
      <ChevronDown className="h-[12px] w-[12px] text-text-secondary" />
    </Icon>
  </Trigger>
));

SelectTrigger.displayName = "SelectTrigger";

const SelectContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Content>
>(({ className, children, ...props }, ref) => (
  <Portal>
    <Content
      ref={ref}
      className={cn(
        "overflow-hidden rounded-[4px] border border-border-default bg-surface-1",
        className,
      )}
      style={{ boxShadow: "var(--shadow-lg)" }}
      position="popper"
      sideOffset={4}
      {...props}
    >
      <Viewport className="p-[4px]">{children}</Viewport>
    </Content>
  </Portal>
));

SelectContent.displayName = "SelectContent";

const SelectItem = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Item>
>(({ className, children, ...props }, ref) => (
  <Item
    ref={ref}
    className={cn(
      "cursor-pointer rounded-[2px] px-[8px] py-[4px] font-mono text-[0.75rem] leading-[1.125rem] text-text-primary outline-none hover:bg-surface-4 data-[highlighted]:bg-surface-4 data-[highlighted]:text-gold-500",
      className,
    )}
    {...props}
  >
    <ItemText>{children}</ItemText>
  </Item>
));

SelectItem.displayName = "SelectItem";

export { Select, SelectContent, SelectItem, SelectTrigger };
