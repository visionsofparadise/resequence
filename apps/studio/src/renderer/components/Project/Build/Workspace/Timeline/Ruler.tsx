import { useDrag } from "@use-gesture/react";
import { useCallback, useMemo, useRef } from "react";
import { useTransients } from "../../../../../hooks/useTransients";
import type { ProjectContext } from "../../../../../models/Context";
import type { PlaybackState } from "../../../../../models/State/Playback";

export const RULER_HEIGHT = 24;

const BUFFER_PX = 200;

interface RulerProps {
	readonly context: ProjectContext;
}

interface TickInterval {
	readonly major: number;
	readonly minor: number;
}

function getTickInterval(pxPerBeat: number): TickInterval {
	const targetMajorPx = 80;
	const targetBeats = targetMajorPx / pxPerBeat;

	if (targetBeats <= 1) return { major: 1, minor: 0.25 };

	if (targetBeats <= 2) return { major: 2, minor: 0.5 };

	if (targetBeats <= 4) return { major: 4, minor: 1 };

	if (targetBeats <= 8) return { major: 8, minor: 2 };

	if (targetBeats <= 16) return { major: 16, minor: 4 };

	if (targetBeats <= 32) return { major: 32, minor: 8 };

	return { major: 64, minor: 16 };
}

interface TickElement {
	readonly container: HTMLDivElement;
	readonly line: HTMLDivElement;
	readonly label?: HTMLSpanElement;
}

function createTickElement(isMajor: boolean): TickElement {
	const container = document.createElement("div");

	container.className = "absolute top-0 h-full";
	container.style.willChange = "transform";

	const line = document.createElement("div");

	if (isMajor) {
		line.className = "absolute bottom-0 w-px h-4 bg-text-secondary";

		const label = document.createElement("span");

		label.className = "absolute type-label text-text-primary whitespace-nowrap";
		label.style.left = "4px";
		label.style.bottom = "10px";
		container.appendChild(line);
		container.appendChild(label);

		return { container, line, label };
	}

	line.className = "absolute bottom-0 w-px h-2 bg-text-secondary/50";
	container.appendChild(line);

	return { container, line };
}

export const Ruler: React.FC<RulerProps> = ({ context }) => {
	const { project, playback, projectStore } = context;

	const rulerRef = useRef<HTMLDivElement>(null);
	const ticksContainerRef = useRef<HTMLDivElement>(null);
	const majorPoolRef = useRef<Array<TickElement>>([]);
	const minorPoolRef = useRef<Array<TickElement>>([]);

	const getOrCreateTick = useCallback((pool: Array<TickElement>, index: number, isMajor: boolean): TickElement => {
		const existing = pool[index];

		if (existing) return existing;

		const tick = createTickElement(isMajor);

		pool.push(tick);
		ticksContainerRef.current?.appendChild(tick.container);

		return tick;
	}, []);

	const updateTicks = useCallback(() => {
		if (!ticksContainerRef.current || !rulerRef.current) return;

		const pxPerBeat = project.timelineZoom.value;
		const scrollX = project.timelineScrollX.value;
		const viewportWidth = rulerRef.current.clientWidth;

		const { major, minor } = getTickInterval(pxPerBeat);

		const visibleStartBeat = Math.max(0, (scrollX - BUFFER_PX) / pxPerBeat);
		const visibleEndBeat = (scrollX + viewportWidth + BUFFER_PX) / pxPerBeat;

		let majorIndex = 0;

		for (let beat = Math.floor(visibleStartBeat / major) * major; beat <= visibleEndBeat; beat += major) {
			if (beat < 0) continue;

			const tick = getOrCreateTick(majorPoolRef.current, majorIndex, true);
			const xPos = beat * pxPerBeat - scrollX;

			tick.container.style.transform = `translateX(${xPos}px)`;
			tick.container.style.display = "";

			if (tick.label) {
				tick.label.textContent = String(Math.round(beat));
			}

			majorIndex++;
		}

		let minorIndex = 0;

		for (let beat = Math.floor(visibleStartBeat / minor) * minor; beat <= visibleEndBeat; beat += minor) {
			if (beat < 0 || beat % major === 0) continue;

			const tick = getOrCreateTick(minorPoolRef.current, minorIndex, false);
			const xPos = beat * pxPerBeat - scrollX;

			tick.container.style.transform = `translateX(${xPos}px)`;
			tick.container.style.display = "";

			minorIndex++;
		}

		for (let pi = majorIndex; pi < majorPoolRef.current.length; pi++) {
			const tick = majorPoolRef.current[pi];

			if (tick) tick.container.style.display = "none";
		}

		for (let pi = minorIndex; pi < minorPoolRef.current.length; pi++) {
			const tick = minorPoolRef.current[pi];

			if (tick) tick.container.style.display = "none";
		}
	}, [project.timelineZoom, project.timelineScrollX, getOrCreateTick]);

	const rulerTransients = useMemo(
		() => [project.timelineZoom, project.timelineScrollX],
		[project.timelineZoom, project.timelineScrollX],
	);

	useTransients(rulerTransients, updateTicks);

	const getBeatFromClientX = useCallback(
		(clientX: number): number => {
			if (!rulerRef.current) return 0;

			const rect = rulerRef.current.getBoundingClientRect();
			const xInViewport = clientX - rect.left;

			return Math.max(0, (xInViewport + project.timelineScrollX.value) / project.timelineZoom.value);
		},
		[project.timelineScrollX, project.timelineZoom],
	);

	const handleClick = useCallback(
		(event: React.MouseEvent) => {
			const beat = getBeatFromClientX(event.clientX);

			projectStore.mutate<PlaybackState>(playback, (proxy) => {
				proxy.beat.committed.value = beat;
			});
		},
		[getBeatFromClientX, playback, projectStore],
	);

	const bindDrag = useDrag(
		({ xy: [clientX], last }) => {
			const beat = getBeatFromClientX(clientX);

			projectStore.mutate<PlaybackState>(playback, (proxy) => {
				proxy.beat.transient.value = beat;
			});

			if (last) {
				projectStore.mutate<PlaybackState>(playback, (proxy) => {
					proxy.beat.committed.value = beat;
				});
			}
		},
		{ pointer: { capture: true, keys: false } },
	);

	return (
		<div
			ref={rulerRef}
			className="sticky top-0 z-10 w-full cursor-col-resize border-b border-border bg-elevated"
			style={{ height: RULER_HEIGHT, touchAction: "none" }}
			onClick={handleClick}
			{...bindDrag()}
		>
			<div ref={ticksContainerRef} className="pointer-events-none absolute inset-0 overflow-visible" />
		</div>
	);
};
