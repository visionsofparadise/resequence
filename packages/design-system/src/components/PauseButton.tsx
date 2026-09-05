import { useFrame } from "@react-three/fiber";
import { useRef, useMemo } from "react";
import { BoxGeometry, MathUtils, type Mesh } from "three";
import IconCanvasButton from "./IconCanvasButton";

export interface PauseButtonProps extends React.ComponentPropsWithRef<"button"> {
	size?: number;
	hovered?: boolean;
}

function PauseBar({
	position,
	hovered,
	colors,
}: {
	position: [number, number, number];
	hovered: boolean;
	colors: { primary: string; muted: string };
}) {
	const meshRef = useRef<Mesh>(null);
	const barGeo = useMemo(() => new BoxGeometry(0.28, 1.2, 0.28), []);

	useFrame((_, delta) => {
		if (!meshRef.current) return;

		if (hovered) {
			meshRef.current.rotation.y += delta * 1.0;
		} else {
			const current = meshRef.current.rotation.y;
			const HALF = Math.PI;
			const nearest = Math.round(current / HALF) * HALF;

			meshRef.current.rotation.y = MathUtils.lerp(current, nearest, 1 - Math.pow(0.001, delta));
		}
	});

	return (
		<mesh ref={meshRef} geometry={barGeo} position={position}>
			<meshLambertMaterial color={hovered ? colors.primary : colors.muted} flatShading />
		</mesh>
	);
}

function PauseBars({ hovered, colors }: { hovered: boolean; colors: { primary: string; muted: string } }) {
	return (
		<group rotation={[0.15, 0, 0]}>
			<PauseBar position={[-0.34, 0, 0]} hovered={hovered} colors={colors} />
			<PauseBar position={[0.34, 0, 0]} hovered={hovered} colors={colors} />
		</group>
	);
}

const PauseButton = ({ size = 48, hovered = false, ...rest }: PauseButtonProps) => (
	<IconCanvasButton
		label="Pause"
		size={size}
		shape={(colors) => <PauseBars hovered={hovered} colors={colors} />}
		{...rest}
	/>
);

export default PauseButton;
