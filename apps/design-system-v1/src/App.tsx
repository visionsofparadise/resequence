import { useCallback, useState } from "react";
import Navigation from "@/components/Navigation";
import FontSwitcher from "@/components/FontSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import Controls from "@/sections/Controls";
import DAWControls from "@/sections/DAWControls";
import Foundations from "@/sections/Foundations";
import Panels from "@/sections/Panels";
import Graph from "@/sections/Graph";
import Timeline from "@/sections/Timeline";

export default function App() {
  const [activeId, setActiveId] = useState("colors");

  const handleNavigate = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-surface-2">
      <header className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-surface-1 px-[16px] py-[8px]">
        <h1 className="font-display text-[1.75rem] leading-[2.25rem] text-text-primary">
          Resequence Design System
        </h1>
        <div className="flex items-center gap-[8px]">
          <FontSwitcher />
          <ThemeToggle />
        </div>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside className="w-[200px] shrink-0 overflow-y-auto border-r border-border-subtle bg-surface-1">
          <Navigation activeId={activeId} onNavigate={handleNavigate} />
        </aside>
        <main className="flex-1 overflow-y-auto bg-surface-2 p-[24px]">
          <Foundations />
          <Controls />
          <DAWControls />
          <Panels />
          <Timeline />
          <Graph />
        </main>
      </div>
    </div>
  );
}
