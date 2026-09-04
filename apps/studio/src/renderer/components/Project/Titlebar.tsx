import { Content, Item, Portal, Root, Separator, Trigger } from "@radix-ui/react-dropdown-menu";
import { useProjectLoader } from "../../utils/projectLoader";
import { useTheme } from "../ThemeProvider";
import type { ProjectContext } from "../../models/Context";

interface TitlebarProps {
	readonly context: ProjectContext;
}

export const Titlebar: React.FC<TitlebarProps> = ({ context }) => {
	const { history } = context;
	const { closeProject } = useProjectLoader(context);
	const { theme, setTheme } = useTheme();

	return (
		<div className="titlebar flex h-[44px] shrink-0 items-center bg-surface border-b border-border px-4">
			<div style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}>
				<Root>
					<Trigger asChild>
						<button className="flex h-7 w-7 items-center justify-center bg-transparent border-none cursor-pointer text-text-secondary hover:text-text-primary transition-colors">
							<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
								<rect x="2" y="3" width="12" height="1.5" />
								<rect x="2" y="7.25" width="12" height="1.5" />
								<rect x="2" y="11.5" width="12" height="1.5" />
							</svg>
						</button>
					</Trigger>
					<Portal>
						<Content
							align="start"
							sideOffset={4}
							className="z-50 min-w-[180px] bg-elevated border border-border p-1"
						>
							<Item
								disabled={!history.canUndo}
								onSelect={() => history.undo()}
								className="flex items-center justify-between px-3 py-1.5 type-label text-text-primary cursor-pointer hover:bg-surface outline-none data-[disabled]:opacity-40 data-[disabled]:pointer-events-none"
							>
								Undo
								<span className="text-text-secondary ml-4">Ctrl+Z</span>
							</Item>
							<Item
								disabled={!history.canRedo}
								onSelect={() => history.redo()}
								className="flex items-center justify-between px-3 py-1.5 type-label text-text-primary cursor-pointer hover:bg-surface outline-none data-[disabled]:opacity-40 data-[disabled]:pointer-events-none"
							>
								Redo
								<span className="text-text-secondary ml-4">Ctrl+Shift+Z</span>
							</Item>
							<Separator className="my-1 h-px bg-border" />
							<Item
								onSelect={() => setTheme(theme === "dark" ? "light" : "dark")}
								className="flex items-center justify-between px-3 py-1.5 type-label text-text-primary cursor-pointer hover:bg-surface outline-none"
							>
								{theme === "light" ? "Dark" : "Light"}
							</Item>
							<Separator className="my-1 h-px bg-border" />
							<Item
								onSelect={closeProject}
								className="flex items-center px-3 py-1.5 type-label text-text-primary cursor-pointer hover:bg-surface outline-none"
							>
								Close Project
							</Item>
						</Content>
					</Portal>
				</Root>
			</div>
			<div className="flex-1 flex items-center justify-center">
				<span className="type-label">RESEQUENCE</span>
			</div>
			<div className="w-[68px] shrink-0" />
		</div>
	);
};
