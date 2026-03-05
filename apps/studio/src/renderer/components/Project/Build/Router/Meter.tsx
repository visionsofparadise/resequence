import { useEffect, useRef, useState } from "react";

interface MeterProps {
	readonly analyserNode: AnalyserNode | undefined;
}

export const Meter: React.FC<MeterProps> = ({ analyserNode }) => {
	const [peak, setPeak] = useState(0);
	const rafRef = useRef<number>(0);
	const bufferRef = useRef<Float32Array<ArrayBuffer> | null>(null);

	useEffect(() => {
		if (!analyserNode) return;

		bufferRef.current = new Float32Array(analyserNode.fftSize);

		function tick(): void {
			if (!analyserNode || !bufferRef.current) return;

			analyserNode.getFloatTimeDomainData(bufferRef.current);

			let max = 0;

			for (const value of bufferRef.current) {
				const abs = Math.abs(value);

				if (abs > max) max = abs;
			}

			setPeak(Math.min(max, 1));
			rafRef.current = requestAnimationFrame(tick);
		}

		rafRef.current = requestAnimationFrame(tick);

		return () => cancelAnimationFrame(rafRef.current);
	}, [analyserNode]);

	return (
		<div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-700">
			<div
				className="h-full rounded-full bg-green-500/60 transition-[width] duration-75"
				style={{ width: `${peak * 100}%` }}
			/>
		</div>
	);
};
