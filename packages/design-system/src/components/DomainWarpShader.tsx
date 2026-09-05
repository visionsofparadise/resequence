import { Canvas, useFrame } from "@react-three/fiber";
import { useRef, useEffect, useMemo } from "react";
import { Color, Vector2, Vector3, type Mesh } from "three";
import { cn } from "../cn";
import { useThemeColors } from "./three-utils";

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec3 uSurface;
  uniform vec3 uAccent1;
  uniform vec3 uAccent2;
  uniform float uScale;
  uniform float uSpeed;
  uniform float uWarp;
  uniform float uColorMix;
  uniform float uColorAmp;
  uniform int uOctaves;

  varying vec2 vUv;

  vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289v2(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289v3(((x * 34.0) + 10.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                       -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289v2(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < 6; i++) {
      if (i >= uOctaves) break;
      value += amplitude * snoise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    return value;
  }

  vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    vec2 p = (uv - 0.5) * vec2(aspect, 1.0) * uScale;
    float t = uTime * uSpeed;

    vec2 q = vec2(
      fbm(p + vec2(0.0, 0.0) + vec2(cos(t * 0.7), sin(t * 0.5)) * 0.8),
      fbm(p + vec2(5.2, 1.3) + vec2(sin(t * 0.6), cos(t * 0.8)) * 0.8)
    );
    vec2 r = vec2(
      fbm(p + uWarp * q + vec2(1.7, 9.2) + vec2(cos(t * 0.3), sin(t * 0.4)) * 0.5),
      fbm(p + uWarp * q + vec2(8.3, 2.8) + vec2(sin(t * 0.5), cos(t * 0.3)) * 0.5)
    );
    float f = fbm(p + uWarp * r);

    float v = f * 0.5 + 0.5;
    float surfLum = dot(uSurface, vec3(0.299, 0.587, 0.114));

    // Direct color ramp: surface → accent1 (coral) → accent2 (teal) at peaks
    vec3 col = mix(uSurface, uAccent1 * (0.3 * uColorAmp), smoothstep(0.3, 0.6, v));
    col = mix(col, uAccent2 * (0.2 * uColorAmp), smoothstep(0.6, 0.9, v));

    // Lift dark mode
    float mixStrength = uColorMix + (1.0 - surfLum) * 0.25;
    col = mix(uSurface, col, mixStrength);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const DEFAULT_SCALE = 0.15;
const DEFAULT_SPEED = 0.16;
const DEFAULT_OCTAVES = 5;
const DEFAULT_WARP = 0.2;
const DEFAULT_COLOR_MIX = 0.65;
const DEFAULT_COLOR_AMP = 2.5;

interface WarpPlaneProps {
	scale: number;
	speed: number;
	octaves: number;
	warp: number;
	colorMix: number;
	colorAmp: number;
}

function WarpPlane({ scale, speed, octaves, warp, colorMix, colorAmp }: WarpPlaneProps) {
	const meshRef = useRef<Mesh>(null);
	const themeColors = useThemeColors();

	const uniforms = useMemo(
		() => ({
			uTime: { value: 0 },
			uResolution: { value: new Vector2(1, 1) },
			uSurface: { value: new Vector3() },
			uAccent1: { value: new Vector3() },
			uAccent2: { value: new Vector3() },
			uScale: { value: scale },
			uSpeed: { value: speed },
			uOctaves: { value: octaves },
			uWarp: { value: warp },
			uColorMix: { value: colorMix },
			uColorAmp: { value: colorAmp },
		}),
		[],
	);

	useEffect(() => {
		const surface = new Color(themeColors.surface);
		const accent1 = new Color(themeColors.accentPrimary);
		const accent2 = new Color(themeColors.accentSecondary);

		uniforms.uSurface.value.set(surface.r, surface.g, surface.b);
		uniforms.uAccent1.value.set(accent1.r, accent1.g, accent1.b);
		uniforms.uAccent2.value.set(accent2.r, accent2.g, accent2.b);
	}, [themeColors, uniforms]);

	useEffect(() => {
		uniforms.uScale.value = scale;
		uniforms.uSpeed.value = speed;
		uniforms.uOctaves.value = octaves;
		uniforms.uWarp.value = warp;
		uniforms.uColorMix.value = colorMix;
		uniforms.uColorAmp.value = colorAmp;
	}, [scale, speed, octaves, warp, colorMix, colorAmp, uniforms]);

	useFrame((state) => {
		uniforms.uTime.value = state.clock.elapsedTime;

		const { width, height } = state.size;

		uniforms.uResolution.value.set(width, height);
	});

	return (
		<mesh ref={meshRef}>
			<planeGeometry args={[2, 2]} />
			<shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />
		</mesh>
	);
}

export default function DomainWarpShader({
	scale = DEFAULT_SCALE,
	speed = DEFAULT_SPEED,
	octaves = DEFAULT_OCTAVES,
	warp = DEFAULT_WARP,
	colorMix = DEFAULT_COLOR_MIX,
	colorAmp = DEFAULT_COLOR_AMP,
	className,
	style,
	ref,
	...rest
}: React.ComponentPropsWithRef<"div"> & {
	scale?: number;
	speed?: number;
	octaves?: number;
	warp?: number;
	colorMix?: number;
	colorAmp?: number;
}) {
	return (
		<div ref={ref} style={{ width: "100%", height: "100%", ...style }} className={cn(className)} {...rest}>
			<Canvas
				orthographic
				camera={{ position: [0, 0, 1], zoom: 1, left: -1, right: 1, top: 1, bottom: -1, near: 0, far: 2 }}
				gl={{ alpha: false, antialias: false }}
				dpr={[1, 1.5]}
			>
				<WarpPlane
					scale={scale}
					speed={speed}
					octaves={octaves}
					warp={warp}
					colorMix={colorMix}
					colorAmp={colorAmp}
				/>
			</Canvas>
		</div>
	);
}
