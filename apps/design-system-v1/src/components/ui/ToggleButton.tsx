import { Root } from "@radix-ui/react-toggle";
import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentPropsWithoutRef, forwardRef } from "react";
import { cn } from "@/utils/cn";

const toggleVariants = cva(
  "inline-flex items-center gap-[6px] rounded-[4px] border border-border-default bg-surface-3 px-[10px] py-[4px] font-mono text-[0.6875rem] leading-[1.125rem] text-text-primary transition-colors hover:bg-surface-4 focus-visible:outline-none active:[box-shadow:var(--shadow-inset-sm)]",
  {
    variants: {
      ledColor: {
        gold: "",
        red: "",
        yellow: "",
      },
    },
    defaultVariants: {
      ledColor: "gold",
    },
  },
);

interface ToggleButtonProps
  extends ComponentPropsWithoutRef<typeof Root>,
    VariantProps<typeof toggleVariants> {}

const LED_STYLES = {
  gold: {
    on: { backgroundColor: "var(--gold-500)", boxShadow: "0 0 4px var(--gold-glow)" },
    off: {},
  },
  red: {
    on: { backgroundColor: "var(--mute-red)", boxShadow: "0 0 4px var(--mute-red)" },
    off: {},
  },
  yellow: {
    on: { backgroundColor: "var(--solo-yellow)", boxShadow: "0 0 4px var(--solo-yellow)" },
    off: {},
  },
};

const ToggleButton = forwardRef<HTMLButtonElement, ToggleButtonProps>(
  ({ className, ledColor, pressed, children, style, ...props }, ref) => {
    const color = ledColor ?? "gold";
    const isPressed = pressed ?? false;
    const ledStyle = isPressed ? LED_STYLES[color].on : LED_STYLES[color].off;

    return (
      <Root
        className={cn(toggleVariants({ ledColor, className }))}
        ref={ref}
        pressed={pressed}
        style={{
          boxShadow: "var(--shadow-sm)",
          borderTop: "1px solid rgba(255,255,255,0.03)",
          borderLeft: "1px solid rgba(255,255,255,0.03)",
          ...style,
        }}
        {...props}
      >
        {children}
        <span
          className="block h-[4px] w-[4px] shrink-0 rounded-full bg-surface-4"
          style={ledStyle}
        />
      </Root>
    );
  },
);

ToggleButton.displayName = "ToggleButton";

export { ToggleButton, toggleVariants };
export type { ToggleButtonProps };
