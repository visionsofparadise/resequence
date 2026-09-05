import { PlayButton, PauseButton, VolumeControl } from "@resequence/design-system";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const iconClass =
	"text-text-secondary hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer p-1";

const TransportBar = () => {
	const [playHovered, setPlayHovered] = useState(false);
	const [playing, setPlaying] = useState(false);

	return (
		<div className="w-full bg-surface flex items-center h-16 border-t border-border relative">
			<div className="flex items-center min-w-[200px] self-stretch">
				<button className="flex items-center hover:text-text-primary transition-colors bg-surface border-r border-border px-4 cursor-pointer self-stretch">
					<div className="flex flex-col justify-center gap-0.5 items-start">
						<span className="text-[10px] uppercase tracking-[0.06em] text-accent-primary leading-none">
							BUILD
						</span>
						<span className="text-[10px] uppercase tracking-[0.06em] tabular-nums leading-none text-text-primary">
							9F2E8A1B4C7D3E6F
						</span>
						<span className="text-[10px] tabular-nums leading-none text-dimmed">2026-03-21 14:32:07</span>
					</div>
					<ChevronDown size={14} className="text-text-secondary ml-6 shrink-0" />
				</button>
			</div>

			<div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 self-stretch">
				<button className="type-label italic hover:text-text-primary transition-colors bg-transparent border border-border px-2 py-0.5 cursor-pointer text-text-secondary">
					1X
				</button>
				<button className={iconClass} aria-label="Rewind">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<polygon points="12,3 0,12 12,21" />
						<polygon points="24,3 12,12 24,21" />
					</svg>
				</button>
				<button className={iconClass} aria-label="Skip back">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<rect x="0" y="3" width="3" height="18" />
						<polygon points="22,3 6,12 22,21" />
					</svg>
				</button>
				<button
					className="text-text-primary hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer px-0 self-stretch flex items-center"
					aria-label={playing ? "Pause" : "Play"}
					onMouseEnter={() => setPlayHovered(true)}
					onMouseLeave={() => setPlayHovered(false)}
				>
					{playing ? (
						<PauseButton size={56} hovered={playHovered} onClick={() => setPlaying((previous) => !previous)} />
					) : (
						<PlayButton size={56} hovered={playHovered} onClick={() => setPlaying((previous) => !previous)} />
					)}
				</button>
				<button className={iconClass} aria-label="Skip forward">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<polygon points="2,3 18,12 2,21" />
						<rect x="21" y="3" width="3" height="18" />
					</svg>
				</button>
				<button className={iconClass} aria-label="Fast forward">
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
						<polygon points="0,3 12,12 0,21" />
						<polygon points="12,3 24,12 12,21" />
					</svg>
				</button>
			</div>

			<div className="flex flex-col gap-1 min-w-[200px] items-end self-stretch justify-center pr-4 ml-auto">
				<div className="flex items-center gap-2" style={{ width: 24 * 4 }}>
					<span className="type-label">VOL</span>
					<div className="flex-1 h-px bg-border" />
					<svg
						width="14"
						height="14"
						viewBox="0 0 24 24"
						fill="currentColor"
						className="text-text-secondary shrink-0"
					>
						<polygon points="2,8 2,16 7,16 14,22 14,2 7,8" />
						<path
							d="M17 8.5c1.3 1.1 2 2.2 2 3.5s-.7 2.4-2 3.5"
							fill="none"
							stroke="currentColor"
							strokeWidth="1.5"
						/>
					</svg>
				</div>
				<VolumeControl level={0.7} />
			</div>
		</div>
	);
};

export default TransportBar;
