import type { ReactNode } from "react";

interface DemoSectionProps {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}

export default function DemoSection({
  id,
  title,
  description,
  children,
}: DemoSectionProps) {
  return (
    <section className="mb-[24px]">
      <div id={id} className="scroll-mt-[60px]" />
      <h2 className="mb-[4px] font-display text-[1.25rem] leading-[1.75rem] text-text-primary">
        {title}
      </h2>
      {description ? (
        <p className="mb-[12px] text-[0.75rem] leading-[1.125rem] text-text-secondary">
          {description}
        </p>
      ) : null}
      <div
        className="rounded-[4px] bg-surface-0 p-[16px]"
        style={{ boxShadow: "var(--shadow-inset-sm)" }}
      >
        {children}
      </div>
    </section>
  );
}
