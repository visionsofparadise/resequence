import { Canvas } from "@react-three/fiber";
import { cn } from "../cn";
import { SceneBackground, useThemeColors } from "./three-utils";

type ThemeColors = ReturnType<typeof useThemeColors>;

interface IconCanvasButtonProps extends Omit<React.ComponentPropsWithRef<"button">, "children"> {
	label: string;
	size?: number;
	shape: (colors: ThemeColors) => React.ReactNode;
}

const IconCanvasButton = ({ label, size = 48, shape, className, ref, ...rest }: IconCanvasButtonProps) => {
	const colors = useThemeColors();

	return (
		<button
			ref={ref}
			type="button"
			aria-label={label}
			style={{ width: size, height: size, padding: 0, border: "none", background: "transparent", cursor: "pointer" }}
			className={cn("focus-visible:ring-1 focus-visible:ring-text-secondary focus-visible:outline-none", className)}
			{...rest}
		>
			<Canvas camera={{ position: [0, 0, 3.5], fov: 40 }} gl={{ alpha: true, antialias: true }} dpr={2}>
				<SceneBackground color={colors.surface} />
				<ambientLight intensity={0.15} />
				<directionalLight position={[3, 1, 2]} intensity={1.5} />
				{shape(colors)}
			</Canvas>
		</button>
	);
};

export default IconCanvasButton;
