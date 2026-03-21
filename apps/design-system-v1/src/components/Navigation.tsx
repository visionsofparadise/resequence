import { Content, Root, Trigger } from "@radix-ui/react-collapsible";
import { useCallback, useState } from "react";
import { cn } from "@/utils/cn";

interface NavItem {
  id: string;
  label: string;
}

interface NavSection {
  title: string;
  items: Array<NavItem>;
}

const SECTIONS: Array<NavSection> = [
  {
    title: "Foundations",
    items: [
      { id: "colors", label: "Colors" },
      { id: "typography", label: "Typography" },
      { id: "shadows", label: "Shadows" },
      { id: "spacing", label: "Spacing" },
    ],
  },
  {
    title: "Controls",
    items: [
      { id: "buttons", label: "Buttons" },
      { id: "toggles", label: "Toggles" },
      { id: "sliders", label: "Sliders" },
      { id: "inputs", label: "Inputs" },
      { id: "selects", label: "Selects" },
    ],
  },
  {
    title: "DAW",
    items: [
      { id: "knobs", label: "Knobs" },
      { id: "faders", label: "Faders" },
      { id: "meters", label: "Meters" },
      { id: "strips", label: "Strips" },
    ],
  },
  {
    title: "Panels",
    items: [
      { id: "properties", label: "Properties" },
      { id: "mixer", label: "Mixer" },
    ],
  },
  {
    title: "Timeline",
    items: [
      { id: "piano-roll", label: "Piano Roll" },
      { id: "curves", label: "Curves" },
      { id: "ruler", label: "Ruler" },
      { id: "waveform", label: "Waveform" },
    ],
  },
  {
    title: "Graph",
    items: [{ id: "nodes", label: "Nodes" }],
  },
];

interface NavigationProps {
  activeId: string;
  onNavigate: (id: string) => void;
}

export default function Navigation({ activeId, onNavigate }: NavigationProps) {
  const [openSections, setOpenSections] = useState<Set<string>>(
    () => new Set(SECTIONS.map((section) => section.title)),
  );

  const toggleSection = useCallback((title: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);

      if (next.has(title)) {
        next.delete(title);
      } else {
        next.add(title);
      }

      return next;
    });
  }, []);

  const handleItemClick = useCallback(
    (id: string) => {
      onNavigate(id);
      const element = document.getElementById(id);

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    },
    [onNavigate],
  );

  return (
    <nav className="flex flex-col gap-[4px] py-[8px]">
      {SECTIONS.map((section) => (
        <Root
          key={section.title}
          open={openSections.has(section.title)}
          onOpenChange={() => {
            toggleSection(section.title);
          }}
        >
          <Trigger className="w-full px-[12px] py-[4px] text-left font-display text-[0.8125rem] leading-[1.125rem] font-medium text-text-secondary hover:text-text-primary">
            {section.title}
          </Trigger>
          <Content>
            <ul className="flex flex-col">
              {section.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => {
                      handleItemClick(item.id);
                    }}
                    className={cn(
                      "w-full px-[12px] py-[3px] text-left font-mono text-[0.75rem] leading-[1.125rem] transition-colors",
                      activeId === item.id
                        ? "border-l-2 border-gold-500 text-text-primary"
                        : "border-l-2 border-transparent text-text-secondary hover:text-text-primary",
                    )}
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </Content>
        </Root>
      ))}
    </nav>
  );
}
