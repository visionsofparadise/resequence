import { useRef } from "react";
import { cn } from "../cn";
import { useVerticalDrag } from "../hooks/useVerticalDrag";

interface KnobProps extends Omit<React.ComponentPropsWithRef<"div">, "onChange"> {
	value: number;
	label: string;
	size?: number;
	onChange?: (v: number) => void;
	overridden?: boolean;
}

const Knob = ({ value, label, size = 40, onChange, overridden = false, className, ref, ...rest }: KnobProps) => {
	const svgRef = useRef<SVGSVGElement>(null);
	const { onPointerDown, onPointerMove, onPointerUp } = useVerticalDrag({ value, travel: 150, onChange });

	const radius = (size - 4) / 2;
	const cx = size / 2;
	const cy = size / 2;
	const startAngle = 135;
	const totalSweep = 270;
	const valueSweep = totalSweep * value;

	const polarToCartesian = (angle: number) => {
		const rad = (angle * Math.PI) / 180;

		return {
			x: cx + radius * Math.cos(rad),
			y: cy + radius * Math.sin(rad),
		};
	};

	const arcPath = (start: number, sweep: number) => {
		if (sweep <= 0) return "";

		const end = start + sweep;
		const sp = polarToCartesian(start);
		const ep = polarToCartesian(end);
		const largeArc = sweep > 180 ? 1 : 0;

		return `M ${sp.x} ${sp.y} A ${radius} ${radius} 0 ${largeArc} 1 ${ep.x} ${ep.y}`;
	};

	return (
		<div ref={ref} className={cn("flex flex-col items-center gap-1", className)} {...rest}>
			<span className="type-label">{Math.round(value * 100)}</span>
			<svg
				ref={svgRef}
				width={size}
				height={size}
				className={onChange ? "cursor-pointer" : undefined}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
			>
				<path
					d={arcPath(startAngle, totalSweep)}
					fill="none"
					stroke="var(--color-dimmed)"
					strokeWidth={2}
					strokeLinecap="butt"
				/>
				{valueSweep > 0 && (
					<path
						d={arcPath(startAngle, valueSweep)}
						fill="none"
						stroke={overridden ? "var(--color-accent-primary)" : "var(--color-text-primary)"}
						strokeWidth={2}
						strokeLinecap="butt"
					/>
				)}
			</svg>
			<span className="type-label">{label}</span>
		</div>
	);
};

export default Knob;
