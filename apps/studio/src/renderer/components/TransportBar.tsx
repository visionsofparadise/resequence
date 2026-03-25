import { useMemo, useRef, useState } from "react";
import { PlayButton, PauseButton, VolumeControl } from "@resequence/design-system";
import type { BuildContext } from "../models/Context";
import { useTransients } from "../hooks/useTransients";
import { useBuilds } from "./Project/hooks/useBuilds";

interface TransportBarProps {
	readonly context: BuildContext;
}

function formatBeatPosition(beat: number): string {
	const bar = Math.floor(beat / 4) + 1;
	const beatInBar = (beat % 4) + 1;

	return `${bar}:${beatInBar.toFixed(1)}`;
}

const formatBuildTimestamp = (timestamp: number) =>
	new Date(timestamp).toLocaleString(undefined, {
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});

export const TransportBar: React.FC<TransportBarProps> = ({ context }) => {
	const { playback, build } = context;
	const entries = useBuilds(context);

	const [playHovered, setPlayHovered] = useState(false);

	const beatRef = useRef<HTMLSpanElement>(null);
	const beatTransients = useMemo(() => [playback.beat], [playback.beat]);

	useTransients(beatTransients, () => {
		if (beatRef.current) beatRef.current.textContent = formatBeatPosition(playback.beat.value);
	});

	const activeBuild = entries.find((entry) => entry.buildPath === build.buildPath);

	return (
		<div className="flex h-16 shrink-0 items-center bg-elevated border-t border-border relative">
			<div className="flex items-center min-w-[200px] self-stretch">
				{entries.length > 0 && (
					<button
						className="flex items-center hover:text-text-primary transition-colors bg-elevated border-r border-border px-4 cursor-pointer self-stretch"
						style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
					>
						<div className="flex flex-col justify-center gap-0.5 items-start">
							<span className="text-[10px] uppercase tracking-[0.06em] text-accent-primary leading-none">BUILD</span>
							{activeBuild && (
								<span className="text-[10px] tabular-nums leading-none text-text-primary">
									{formatBuildTimestamp(activeBuild.timestamp)}
								</span>
							)}
						</div>
					</button>
				)}
			</div>

			<div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-3 self-stretch">
				<button
					className="text-text-secondary hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer p-1"
					aria-label="Stop"
				>
					<svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
						<rect x="2" y="2" width="12" height="12" />
					</svg>
				</button>
				<button
					className="text-text-primary hover:text-text-primary transition-colors bg-transparent border-none cursor-pointer px-0 self-stretch flex items-center"
					aria-label={playback.playing ? "Pause" : "Play"}
					onMouseEnter={() => setPlayHovered(true)}
					onMouseLeave={() => setPlayHovered(false)}
				>
					{playback.playing ? (
						<PauseButton size={32} hovered={playHovered} />
					) : (
						<PlayButton size={32} hovered={playHovered} />
					)}
				</button>
				<span ref={beatRef} className="type-value tabular-nums min-w-[4rem] text-center">
					{formatBeatPosition(playback.beat.value)}
				</span>
			</div>

			<div className="flex flex-col gap-1 min-w-[200px] items-end self-stretch justify-center pr-4 ml-auto">
				<div className="flex items-center gap-2" style={{ width: 24 * 4 }}>
					<span className="type-label">VOL</span>
					<div className="flex-1 h-px bg-border" />
					<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-text-secondary shrink-0">
						<polygon points="2,8 2,16 7,16 14,22 14,2 7,8" />
						<path d="M17 8.5c1.3 1.1 2 2.2 2 3.5s-.7 2.4-2 3.5" fill="none" stroke="currentColor" strokeWidth="1.5" />
					</svg>
				</div>
				<VolumeControl level={0.7} />
			</div>
		</div>
	);
};
