import {
	DomainWarpShader,
	BarcodeIcon,
	ConcentricIcon,
	DotCircleIcon,
	DiagonalIcon,
	DotGridIcon,
	LinesIcon,
	PrimaryIcon,
	CrosshatchIcon,
	CheckerboardIcon,
} from "@resequence/design-system";
import { NAV_HEIGHT } from "../constants";
import type { IconProps } from "@resequence/design-system";

const iconMap: Record<string, React.ComponentType<IconProps>> = {
	primary: PrimaryIcon,
	barcode: BarcodeIcon,
	concentric: ConcentricIcon,
	"dot-circle": DotCircleIcon,
	"dot-grid": DotGridIcon,
	lines: LinesIcon,
	diagonal: DiagonalIcon,
	crosshatch: CrosshatchIcon,
	checkerboard: CheckerboardIcon,
};

interface RecentProject {
	name: string;
	path: string;
	lastOpened: string;
	design: string;
	color: string;
}

const recentProjects: Array<RecentProject> = [
	{
		name: "UNTITLED_01",
		path: "~/projects/untitled_01",
		lastOpened: "2026-03-21 14:32",
		design: "barcode",
		color: "var(--color-unit-1)",
	},
	{
		name: "DREAMSTATE",
		path: "~/projects/dreamstate",
		lastOpened: "2026-03-20 09:15",
		design: "concentric",
		color: "var(--color-unit-3)",
	},
	{
		name: "FLUX_EP",
		path: "~/projects/flux_ep",
		lastOpened: "2026-03-18 22:41",
		design: "dot-circle",
		color: "var(--color-accent-primary)",
	},
	{
		name: "TESTBED",
		path: "~/projects/testbed",
		lastOpened: "2026-03-15 11:08",
		design: "diagonal",
		color: "var(--color-unit-4)",
	},
	{
		name: "COLLAB_01",
		path: "~/projects/collab_01",
		lastOpened: "2026-03-12 16:30",
		design: "dot-grid",
		color: "var(--color-unit-5)",
	},
	{
		name: "SKETCH_03",
		path: "~/projects/sketch_03",
		lastOpened: "2026-03-10 08:22",
		design: "lines",
		color: "var(--color-unit-2)",
	},
	{
		name: "AMBIENT_WIP",
		path: "~/projects/ambient_wip",
		lastOpened: "2026-03-08 19:55",
		design: "primary",
		color: "var(--color-unit-6)",
	},
	{
		name: "RESEQUENCE",
		path: "~/projects/resequence",
		lastOpened: "2026-03-05 13:40",
		design: "crosshatch",
		color: "var(--color-accent-secondary)",
	},
	{
		name: "DRONE_SET",
		path: "~/projects/drone_set",
		lastOpened: "2026-03-01 07:12",
		design: "checkerboard",
		color: "var(--color-unit-1)",
	},
];

const HomeView = () => (
	<div className="flex items-center justify-center" style={{ height: `calc(100vh - ${NAV_HEIGHT}px)` }}>
		<div
			className="grid w-full border-t border-b border-border"
			style={{ gridTemplateColumns: "2fr 1fr", gridTemplateRows: "auto 240px" }}
		>
			{/* Identity cell */}
			<div className="border-r border-b border-border p-8 relative overflow-hidden">
				<p className="type-label mb-3 text-accent-primary">HOME</p>
				<h1 className="type-display text-[56px] leading-none">RESEQUENCE</h1>
				<p className="type-display-outline text-[56px] leading-none mt-1">RESEQUENCE</p>
				<p className="type-label mt-4 text-dimmed">AUDIO AS CODE</p>
				<span className="type-label text-dimmed absolute bottom-3 right-4">V0.1.0</span>
			</div>

			{/* Recent projects — 2 columns */}
			<div className="border-b border-border p-6 flex flex-col">
				<p className="type-label mb-4">RECENT</p>
				<div className="grid grid-cols-2 gap-x-4 gap-y-2 flex-1 overflow-auto">
					{recentProjects.map((project) => (
						<button
							key={project.path}
							className="flex items-center gap-3 bg-transparent border-none cursor-pointer p-0 group text-left"
						>
							<div className="shrink-0">
								{(() => {
									const Icon = iconMap[project.design] ?? PrimaryIcon;

									return <Icon color={project.color} />;
								})()}
							</div>
							<div className="flex flex-col gap-0.5 min-w-0">
								<span className="type-label text-text-primary group-hover:text-accent-primary transition-colors leading-none">
									{project.name}
								</span>
								<span className="type-label text-[8px] text-dimmed leading-none truncate">{project.path}</span>
								<span className="type-label text-[8px] text-border leading-none">{project.lastOpened}</span>
							</div>
						</button>
					))}
				</div>
			</div>

			{/* Bottom left — shader art */}
			<div className="border-r border-border" style={{ position: "relative" }}>
				<div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
					<DomainWarpShader />
				</div>
			</div>

			{/* Create / Open project */}
			<div className="border-border p-6 flex flex-col justify-between">
				<p className="type-label mb-4">PROJECT</p>
				<div className="flex flex-col gap-3 mt-auto">
					<button className="type-label text-surface bg-text-primary border-none px-4 py-3 cursor-pointer hover:opacity-90 transition-opacity text-left">
						CREATE PROJECT
					</button>
					<button className="type-label text-text-primary bg-transparent border border-border px-4 py-3 cursor-pointer hover:border-text-primary transition-colors text-left">
						OPEN PROJECT
					</button>
				</div>
			</div>
		</div>
	</div>
);

export default HomeView;
