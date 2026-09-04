import { cn } from "../cn";

interface MeterProps extends React.ComponentPropsWithRef<"div"> {
	level: number;
	height?: number;
	width?: number;
	barRef?: React.Ref<HTMLDivElement>;
}

const Meter = ({ level, height = 80, width = 4, barRef, className, ref, style, ...rest }: MeterProps) => (
	<div ref={ref} className={cn("relative bg-elevated", className)} style={{ width, height, ...style }} {...rest}>
		<div
			ref={barRef}
			className="absolute bottom-0 w-full"
			style={{
				height: `${level * 100}%`,
				background: "linear-gradient(to top, var(--color-text-primary), var(--color-accent-primary))",
			}}
		/>
	</div>
);

export default Meter;
