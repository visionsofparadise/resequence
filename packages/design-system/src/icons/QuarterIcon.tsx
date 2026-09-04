import type { IconProps } from "./PrimaryIcon";

const QuarterIcon = ({ color, size = 32, className, ref, style, ...rest }: IconProps) => (
	<div ref={ref} className={className} style={style} {...rest}>
		<svg width={size} height={size} viewBox="0 0 32 32">
			<rect x="0.5" y="0.5" width="31" height="31" stroke={color} fill="none" strokeWidth="1" />
			<rect x="0" y="16" width="16" height="16" fill={color} />
		</svg>
	</div>
);

export default QuarterIcon;
