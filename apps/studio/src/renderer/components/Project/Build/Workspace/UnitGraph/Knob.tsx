import { useEffect, useRef } from "react";
import type { StudioDriver } from "../../models/StudioDriver";

export interface KnobProps {
	readonly label: string;
	readonly driver: StudioDriver;
	readonly range: readonly [number, number];
	readonly step?: number;
	readonly unit?: string;
}

export const Knob: React.FC<KnobProps> = ({ label, driver, range, step = 1, unit = "" }) => {
	const indicatorRef = useRef<HTMLDivElement>(null);
	const displayRef = useRef<HTMLSpanElement>(null);

	const [min, max] = range;

	useEffect(
		() =>
			driver.subscribe((normalized) => {
				if (!indicatorRef.current || !displayRef.current) return;

				const rotation = -135 + normalized * 270;
				indicatorRef.current.style.transform = `rotate(${rotation}deg)`;

				const value = normalized * (max - min) + min;
				const displayValue = Number.isInteger(step) ? Math.round(value) : value.toFixed(1);
				displayRef.current.textContent = `${displayValue}${unit}`;
			}),
		[driver, min, max, step, unit],
	);

	return (
		<div className="flex flex-col items-center gap-1 select-none opacity-60">
			<div className="relative w-10 h-10 rounded-full bg-zinc-800 border-2 border-zinc-600 cursor-default">
				<div
					ref={indicatorRef}
					className="absolute inset-2 flex items-start justify-center"
				>
					<div className="w-0.5 h-2 bg-white rounded-full" />
				</div>
			</div>
			<span
				ref={displayRef}
				className="text-xs text-zinc-400 font-medium"
			>
				0
			</span>
			<span className="text-[10px] text-zinc-500 uppercase tracking-wide">{label}</span>
		</div>
	);
};
