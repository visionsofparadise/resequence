import { useRef } from "react";
import { cn } from "../cn";
import { useVerticalDrag } from "../hooks/useVerticalDrag";

interface FaderProps extends Omit<React.ComponentPropsWithRef<"div">, "onChange"> {
	value: number;
	label: string;
	height?: number;
	width?: number;
	onChange?: (v: number) => void;
}

const Fader = ({ value, label, height = 80, width = 24, onChange, className, ref, ...rest }: FaderProps) => {
	const trackRef = useRef<HTMLDivElement>(null);
	const { onPointerDown, onPointerMove, onPointerUp } = useVerticalDrag({ value, travel: height, onChange });

	return (
		<div ref={ref} className={cn("flex flex-col items-center gap-2", className)} {...rest}>
			<div
				ref={trackRef}
				className="relative flex justify-center"
				style={{ width, height, cursor: onChange ? "ns-resize" : undefined }}
				onPointerDown={onPointerDown}
				onPointerMove={onPointerMove}
				onPointerUp={onPointerUp}
			>
				<div className="absolute left-1/2 -translate-x-px bg-dimmed" style={{ width: 1, height: "100%" }} />
				<div
					className="absolute bg-text-primary"
					style={{
						width: 12,
						height: 4,
						left: "50%",
						bottom: `${value * 100}%`,
						transform: "translate(-50%, 50%)",
					}}
				/>
			</div>
			<span className="type-label">{label}</span>
		</div>
	);
};

export default Fader;
