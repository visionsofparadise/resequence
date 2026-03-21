import { type InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "rounded-[4px] border border-border-default bg-surface-4 px-[8px] py-[4px] font-mono text-[0.75rem] leading-[1.125rem] text-text-primary placeholder:text-text-tertiary focus:border-gold-500 focus:outline-none",
        className,
      )}
      style={{
        boxShadow: "var(--shadow-inset-sm)",
      }}
      onFocus={(ev) => {
        Object.assign(ev.currentTarget.style, {
          boxShadow: "var(--shadow-inset-sm), 0 0 0 1px var(--gold-glow)",
        });
        props.onFocus?.(ev);
      }}
      onBlur={(ev) => {
        Object.assign(ev.currentTarget.style, {
          boxShadow: "var(--shadow-inset-sm)",
        });
        props.onBlur?.(ev);
      }}
      {...props}
    />
  ),
);

Input.displayName = "Input";

export { Input };
export type { InputProps };
