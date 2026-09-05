import { useRef, useState, useCallback, useEffect, type WheelEvent, type MouseEvent } from "react";
import { TRANSPORT_HEIGHT, NAV_HEIGHT } from "../constants";
import { composition, PIXELS_PER_BEAT, BEATS_PER_BAR } from "../demo-data";
import type { TreePattern, Note, AutomationPoint } from "../demo-data";

const MIN_PX_PER_BEAT = 12;
const MAX_PX_PER_BEAT = 200;
const PLAYHEAD_BEAT = 17;
const HEADER_H = 18;
const NOTE_ROW_H = 6;
const BODY_H = 48;

const hashString = (input: string): number => {
	let hash = 5381;

	for (let ix = 0; ix < input.length; ix++) {
		hash = ((hash << 5) + hash + input.charCodeAt(ix)) | 0;
	}

	return Math.abs(hash);
};

const seededRandom = (seed: number): (() => number) => {
	let state = seed;

	return () => {
		state = (state * 1103515245 + 12345) & 0x7fffffff;

		return state / 0x7fffffff;
	};
};

const ClipHeader = ({ name, color }: { name: string; color?: string }) => (
	<div
		className="px-1.5 flex items-center cursor-pointer"
		style={{ height: HEADER_H, backgroundColor: color ?? "var(--color-surface)" }}
	>
		<span
			className="type-display text-[11px]"
			style={{
				lineHeight: "14px",
				color: color ? "var(--color-surface)" : "var(--color-text-primary)",
			}}
		>
			{name}
		</span>
	</div>
);

const MidiClip = ({ pattern, pxPerBeat }: { pattern: TreePattern; pxPerBeat: number }) => {
	const notes = pattern.notes ?? [];

	if (notes.length === 0) return null;

	const pitches = notes.map((note: Note) => note.pitch);
	const minPitch = Math.min(...pitches) - 2;
	const maxPitch = Math.max(...pitches) + 2;
	const pitchRange = maxPitch - minPitch + 1;
	const gridH = pitchRange * NOTE_ROW_H;
	const width = pattern.beats * pxPerBeat;

	return (
		<div
			className="bg-elevated shrink-0 overflow-hidden outline outline-1 outline-border -outline-offset-1 cursor-pointer"
			style={{ width, height: gridH + HEADER_H }}
		>
			<ClipHeader name={pattern.name} color={pattern.unitColor} />
			<svg width={width} height={gridH} className="block">
				{Array.from({ length: pitchRange + 1 }, (_, row) => {
					const isOctave = (maxPitch - row) % 12 === 0;

					return (
						<line
							key={`h${row}`}
							x1={0}
							y1={row * NOTE_ROW_H}
							x2={width}
							y2={row * NOTE_ROW_H}
							stroke="var(--color-border)"
							strokeOpacity={isOctave ? 0.6 : 0.3}
						/>
					);
				})}
				{Array.from({ length: Math.ceil(pattern.beats) + 1 }, (_, col) => (
					<line
						key={`v${col}`}
						x1={col * pxPerBeat}
						y1={0}
						x2={col * pxPerBeat}
						y2={gridH}
						stroke="var(--color-border)"
						strokeOpacity={col % BEATS_PER_BAR === 0 ? 0.5 : 0.2}
					/>
				))}
				{notes.map((note: Note, ix: number) => (
					<rect
						key={ix}
						x={note.beat * pxPerBeat}
						y={(maxPitch - note.pitch) * NOTE_ROW_H}
						width={note.duration * pxPerBeat}
						height={NOTE_ROW_H}
						fill={pattern.unitColor}
						opacity={0.4 + (note.velocity / 127) * 0.6}
					/>
				))}
			</svg>
		</div>
	);
};

const AutomationClip = ({ pattern, pxPerBeat }: { pattern: TreePattern; pxPerBeat: number }) => {
	const points = pattern.automation ?? [];

	if (points.length === 0) return null;

	const width = pattern.beats * pxPerBeat;
	const pts = points.map((pt: AutomationPoint) => ({
		x: pt.beat * pxPerBeat,
		y: (1 - pt.value) * BODY_H,
	}));
	const linePath = pts.map((pt, ix) => `${ix === 0 ? "M" : "L"}${pt.x},${pt.y}`).join(" ");
	const last = pts[pts.length - 1];
	const first = pts[0];
	const fillPath = last && first ? `${linePath} L${last.x},${BODY_H} L${first.x},${BODY_H} Z` : "";

	return (
		<div
			className="bg-elevated shrink-0 overflow-hidden outline outline-1 outline-border -outline-offset-1 cursor-pointer"
			style={{ width, height: BODY_H + HEADER_H }}
		>
			<ClipHeader name={pattern.name} color={pattern.unitColor} />
			<svg width={width} height={BODY_H} className="block">
				<path d={fillPath} fill={pattern.unitColor} opacity={0.1} />
				<path d={linePath} fill="none" stroke={pattern.unitColor} strokeWidth={1.5} />
				{points.map((pt: AutomationPoint, ix: number) => (
					<circle key={ix} cx={pt.beat * pxPerBeat} cy={(1 - pt.value) * BODY_H} r={3} fill={pattern.unitColor} />
				))}
			</svg>
		</div>
	);
};

const AudioClip = ({ pattern, pxPerBeat }: { pattern: TreePattern; pxPerBeat: number }) => {
	const width = pattern.beats * pxPerBeat;
	const rand = seededRandom(hashString(pattern.name));
	const sampleCount = Math.max(Math.floor(width / 2), 1);
	const peaks = Array.from({ length: sampleCount }, () => 0.2 + rand() * 0.8);
	const centerY = BODY_H / 2;

	return (
		<div
			className="bg-elevated shrink-0 overflow-hidden outline outline-1 outline-border -outline-offset-1 cursor-pointer"
			style={{ width, height: BODY_H + HEADER_H }}
		>
			<ClipHeader name={pattern.name} color={pattern.unitColor} />
			<svg width={width} height={BODY_H} className="block">
				{peaks.map((peak, ix) => {
					const x = (ix / sampleCount) * width;
					const halfH = peak * centerY * 0.9;

					return (
						<line
							key={ix}
							x1={x}
							y1={centerY - halfH}
							x2={x}
							y2={centerY + halfH}
							stroke={pattern.unitColor}
							strokeOpacity={0.6}
							strokeWidth={1.5}
						/>
					);
				})}
			</svg>
		</div>
	);
};

const PatternBox = ({ pattern, pxPerBeat }: { pattern: TreePattern; pxPerBeat: number }): React.ReactNode => {
	if (pattern.type === "clip") {
		if (pattern.clipType === "automation") return <AutomationClip pattern={pattern} pxPerBeat={pxPerBeat} />;

		if (pattern.clipType === "audio") return <AudioClip pattern={pattern} pxPerBeat={pxPerBeat} />;

		return <MidiClip pattern={pattern} pxPerBeat={pxPerBeat} />;
	}

	if (pattern.type === "layer") {
		return (
			<div className="flex flex-col shrink-0">
				{(pattern.children ?? []).map((child, ix) => (
					<PatternBox key={ix} pattern={child} pxPerBeat={pxPerBeat} />
				))}
			</div>
		);
	}

	return (
		<div className="shrink-0 outline outline-1 outline-border -outline-offset-1 bg-surface diagonal-stripes">
			{pattern.name && <ClipHeader name={pattern.name} />}
			<div className="flex flex-row">
				{(pattern.children ?? []).map((child, ix) => (
					<PatternBox key={ix} pattern={child} pxPerBeat={pxPerBeat} />
				))}
			</div>
		</div>
	);
};

const BeatRuler = ({ totalBeats, pxPerBeat }: { totalBeats: number; pxPerBeat: number }) => {
	const width = totalBeats * pxPerBeat;
	const ticks: Array<{ x: number; height: number; label?: string }> = [];

	for (let beat = 0; beat <= totalBeats; beat++) {
		const isBar = beat % BEATS_PER_BAR === 0;

		ticks.push({
			x: beat * pxPerBeat,
			height: isBar ? 16 : 10,
			label: isBar ? String(beat / BEATS_PER_BAR + 1) : undefined,
		});
	}

	return (
		<div className="relative shrink-0 bg-elevated" style={{ width, height: 24 }}>
			{ticks.map((tick, ix) => (
				<div key={ix} className="absolute bottom-0" style={{ left: tick.x }}>
					<div className="bg-border" style={{ width: 1, height: tick.height }} />
					{tick.label && (
						<span className="type-label absolute whitespace-nowrap" style={{ left: 4, bottom: 8 }}>
							{tick.label}
						</span>
					)}
				</div>
			))}
		</div>
	);
};

const TimelineView = () => {
	const containerRef = useRef<HTMLDivElement>(null);
	const [pxPerBeat, setPxPerBeat] = useState(PIXELS_PER_BEAT);
	const [pan, setPan] = useState({ x: 60, y: 40 });
	const isPanning = useRef(false);
	const panStart = useRef({ x: 0, y: 0 });
	const panOrigin = useRef({ x: 0, y: 0 });
	const contentRef = useRef<HTMLDivElement>(null);
	const [contentHeight, setContentHeight] = useState(0);

	useEffect(() => {
		if (contentRef.current) setContentHeight(contentRef.current.offsetHeight);
	}, [pxPerBeat]);

	const handleWheel = useCallback(
		(event: WheelEvent<HTMLDivElement>) => {
			event.preventDefault();

			if (event.ctrlKey || event.metaKey) {
				const rect = containerRef.current?.getBoundingClientRect();

				if (!rect) return;

				const cursorX = event.clientX - rect.left;
				const cursorY = event.clientY - rect.top;
				const worldX = (cursorX - pan.x) / pxPerBeat;
				const worldY = cursorY - pan.y;
				const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
				const newPx = Math.min(MAX_PX_PER_BEAT, Math.max(MIN_PX_PER_BEAT, pxPerBeat * zoomFactor));

				setPxPerBeat(newPx);
				setPan({ x: cursorX - worldX * newPx, y: cursorY - worldY });
			} else if (event.shiftKey) {
				setPan((previous) => ({ ...previous, x: previous.x - event.deltaY }));
			} else {
				setPan((previous) => ({ ...previous, y: previous.y - event.deltaY, x: previous.x - event.deltaX }));
			}
		},
		[pan, pxPerBeat],
	);

	const handleMouseDown = useCallback(
		(event: MouseEvent<HTMLDivElement>) => {
			if (event.target !== containerRef.current) return;

			isPanning.current = true;
			panStart.current = { x: event.clientX, y: event.clientY };
			panOrigin.current = { ...pan };
			event.preventDefault();
		},
		[pan],
	);

	useEffect(() => {
		const handleMouseMove = (event: globalThis.MouseEvent) => {
			if (!isPanning.current) return;

			setPan({
				x: panOrigin.current.x + event.clientX - panStart.current.x,
				y: panOrigin.current.y + event.clientY - panStart.current.y,
			});
		};
		const handleMouseUp = () => {
			isPanning.current = false;
		};

		window.addEventListener("mousemove", handleMouseMove);
		window.addEventListener("mouseup", handleMouseUp);

		return () => {
			window.removeEventListener("mousemove", handleMouseMove);
			window.removeEventListener("mouseup", handleMouseUp);
		};
	}, []);

	return (
		<div
			ref={containerRef}
			onWheel={handleWheel}
			onMouseDown={handleMouseDown}
			className="bg-surface relative overflow-hidden"
			style={{ height: `calc(100vh - ${TRANSPORT_HEIGHT}px - ${NAV_HEIGHT}px)` }}
		>
			<div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none select-none z-0 flex flex-col items-center gap-1">
				<div className="flex items-center gap-1">
					<div className="w-[6px] h-[6px] bg-accent-primary shrink-0" />
					<span className="type-label text-dimmed leading-none">00:00:00.000</span>
				</div>
				<span className="type-label text-border leading-none">120 BPM · 24 BARS</span>
			</div>
			<div
				className="absolute top-4 left-4 pointer-events-none select-none z-0 flex flex-col gap-1"
				style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
			>
				<div className="flex items-end gap-px w-[40px]">
					{(() => {
						const hash = "9F2E8A1B4C7D3E6F";
						let seed = 0;

						for (let ix = 0; ix < hash.length; ix++) seed = ((seed << 5) - seed + hash.charCodeAt(ix)) | 0;

						const bars: Array<number> = [];
						let rng = Math.abs(seed);

						for (let bx = 0; bx < 48; bx++) {
							rng = (rng * 1103515245 + 12345) & 0x7fffffff;
							bars.push((rng % 3) + 1);
						}

						return bars.map((barW, ix) => (
							<div
								key={ix}
								className={ix % 2 === 0 ? "bg-border" : "bg-transparent"}
								style={{ width: "100%", height: barW }}
							/>
						));
					})()}
				</div>
				<span className="type-label text-border self-end">9F2E8A1B4C7D3E6F</span>
			</div>
			<div
				className="absolute top-4 right-6 pointer-events-none select-none z-0"
				style={{ writingMode: "vertical-rl" }}
			>
				<span className="type-display text-[56px] leading-none text-border block">RESEQUENCE</span>
				<div className="flex items-center gap-3 mt-1">
					<span className="type-label text-border">AUDIO AS CODE</span>
					<div className="flex-1 w-px bg-border" />
					<span className="type-label text-border">V0.1.0</span>
				</div>
			</div>
			<div
				ref={contentRef}
				className="absolute top-0 left-0 z-[1]"
				style={{ transform: `translate(${pan.x}px, ${pan.y}px)` }}
			>
				<BeatRuler totalBeats={composition.beats} pxPerBeat={pxPerBeat} />
				<div className="relative">
					<PatternBox pattern={composition} pxPerBeat={pxPerBeat} />
					<div
						className="bg-accent-primary absolute top-0 pointer-events-none z-10"
						style={{
							left: PLAYHEAD_BEAT * pxPerBeat,
							width: 1,
							height: contentHeight > 24 ? contentHeight - 24 : "100%",
						}}
					/>
				</div>
			</div>
		</div>
	);
};

export default TimelineView;
