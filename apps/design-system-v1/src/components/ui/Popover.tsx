import { Arrow, Content, Portal, Root, Trigger } from "@radix-ui/react-popover";
import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "@/utils/cn";

function Popover(props: ComponentPropsWithoutRef<typeof Root>) {
  return <Root {...props} />;
}

const PopoverTrigger = Trigger;

const PopoverContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Content>
>(({ className, children, sideOffset = 4, ...props }, ref) => (
  <Portal>
    <Content
      ref={ref}
      className={cn(
        "z-50 rounded-[4px] border border-border-default bg-surface-1 p-[12px] focus:outline-none",
        className,
      )}
      style={{ boxShadow: "var(--shadow-lg)" }}
      sideOffset={sideOffset}
      {...props}
    >
      {children}
      <Arrow className="fill-surface-1" />
    </Content>
  </Portal>
));

PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverContent, PopoverTrigger };
