import { Content, List, Root, Trigger } from "@radix-ui/react-tabs";
import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "@/utils/cn";

function Tabs(props: ComponentPropsWithoutRef<typeof Root>) {
  return <Root {...props} />;
}

const TabsList = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof List>
>(({ className, ...props }, ref) => (
  <List
    ref={ref}
    className={cn(
      "flex border-b border-border-subtle",
      className,
    )}
    {...props}
  />
));

TabsList.displayName = "TabsList";

const TabsTrigger = forwardRef<
  HTMLButtonElement,
  ComponentPropsWithoutRef<typeof Trigger>
>(({ className, ...props }, ref) => (
  <Trigger
    ref={ref}
    className={cn(
      "border-b-2 border-transparent px-[12px] py-[6px] font-mono text-[0.75rem] leading-[1.125rem] text-text-secondary transition-colors hover:text-text-primary data-[state=active]:border-gold-500 data-[state=active]:text-text-primary",
      className,
    )}
    {...props}
  />
));

TabsTrigger.displayName = "TabsTrigger";

const TabsContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Content>
>(({ className, ...props }, ref) => (
  <Content
    ref={ref}
    className={cn("pt-[12px]", className)}
    {...props}
  />
));

TabsContent.displayName = "TabsContent";

export { Tabs, TabsContent, TabsList, TabsTrigger };
