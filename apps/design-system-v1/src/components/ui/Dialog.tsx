import {
  Close,
  Content,
  Description,
  Overlay,
  Portal,
  Root,
  Title,
  Trigger,
} from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "@/utils/cn";

function Dialog(props: ComponentPropsWithoutRef<typeof Root>) {
  return <Root {...props} />;
}

const DialogTrigger = Trigger;

const DialogContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof Content>
>(({ className, children, ...props }, ref) => (
  <Portal>
    <Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <Content
      ref={ref}
      className={cn(
        "fixed top-[50%] left-[50%] z-50 w-full max-w-[400px] translate-x-[-50%] translate-y-[-50%] rounded-[4px] border border-border-default bg-surface-0 p-[24px] focus:outline-none",
        className,
      )}
      style={{
        boxShadow: "var(--shadow-xl)",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        borderLeft: "1px solid rgba(255,255,255,0.06)",
      }}
      {...props}
    >
      {children}
      <Close className="absolute top-[12px] right-[12px] text-text-secondary hover:text-text-primary">
        <X className="h-[16px] w-[16px]" />
      </Close>
    </Content>
  </Portal>
));

DialogContent.displayName = "DialogContent";

const DialogTitle = forwardRef<
  HTMLHeadingElement,
  ComponentPropsWithoutRef<typeof Title>
>(({ className, ...props }, ref) => (
  <Title
    ref={ref}
    className={cn(
      "mb-[12px] font-display text-[1.25rem] leading-[1.75rem] text-text-primary",
      className,
    )}
    {...props}
  />
));

DialogTitle.displayName = "DialogTitle";

const DialogDescription = forwardRef<
  HTMLParagraphElement,
  ComponentPropsWithoutRef<typeof Description>
>(({ className, ...props }, ref) => (
  <Description
    ref={ref}
    className={cn(
      "text-[0.75rem] leading-[1.125rem] text-text-secondary",
      className,
    )}
    {...props}
  />
));

DialogDescription.displayName = "DialogDescription";

export { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger };
