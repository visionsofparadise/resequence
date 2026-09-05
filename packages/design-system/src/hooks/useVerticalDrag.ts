import { useCallback, useRef, useState } from "react";

interface VerticalDragInput {
	readonly value: number;
	readonly travel: number;
	readonly onChange?: (value: number) => void;
}

interface VerticalDrag {
	readonly onPointerDown: (event: React.PointerEvent) => void;
	readonly onPointerMove: (event: React.PointerEvent) => void;
	readonly onPointerUp: () => void;
}

export function useVerticalDrag({ value, travel, onChange }: VerticalDragInput): VerticalDrag {
	const [dragging, setDragging] = useState(false);
	const startY = useRef(0);
	const startValue = useRef(0);

	const onPointerDown = useCallback(
		(event: React.PointerEvent) => {
			if (!onChange) return;

			setDragging(true);
			(event.target as Element).setPointerCapture(event.pointerId);
			startY.current = event.clientY;
			startValue.current = value;
		},
		[onChange, value],
	);

	const onPointerMove = useCallback(
		(event: React.PointerEvent) => {
			if (!dragging || !onChange) return;

			const delta = (startY.current - event.clientY) / travel;

			onChange(Math.max(0, Math.min(1, startValue.current + delta)));
		},
		[dragging, onChange, travel],
	);

	const onPointerUp = useCallback(() => {
		setDragging(false);
	}, []);

	return { onPointerDown, onPointerMove, onPointerUp };
}
