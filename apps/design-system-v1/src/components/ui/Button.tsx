import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[4px] font-mono text-[0.75rem] leading-[1.125rem] transition-colors focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "border border-border-default bg-surface-3 text-text-primary hover:bg-surface-4 active:[box-shadow:var(--shadow-inset-sm)]",
        ghost:
          "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
        destructive:
          "border border-border-default bg-surface-3 text-text-primary hover:text-meter-red active:[box-shadow:var(--shadow-inset-sm)]",
      },
      size: {
        sm: "px-[8px] py-[4px] text-[0.6875rem]",
        default: "px-[12px] py-[6px]",
        lg: "px-[16px] py-[8px] text-[0.8125rem]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    const isDefault = variant === "default" || variant === undefined;
    const isDestructive = variant === "destructive";
    const needsElevation = isDefault || isDestructive;

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        style={{
          ...(needsElevation
            ? {
                boxShadow: "var(--shadow-sm)",
                borderTop: "1px solid rgba(255,255,255,0.03)",
                borderLeft: "1px solid rgba(255,255,255,0.03)",
              }
            : {}),
          ...style,
        }}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
export type { ButtonProps };
