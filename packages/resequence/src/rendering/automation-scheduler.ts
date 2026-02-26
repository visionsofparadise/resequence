import type { KeyframeCurve } from "../patterns/automate";
import type { PositionedAutomation } from "../patterns/pattern";
import type { ScheduleContext } from "./schedule-context";
import { beatsToSeconds } from "./tempo-map";
import { lowerBound } from "./utils";

const ADJACENCY_EPSILON = 0.01;

interface AbsolutePointKeyframe {
	readonly kind: "point";
	readonly beat: number;
	readonly value: number;
	readonly curve?: KeyframeCurve;
}

interface AbsoluteCurveKeyframe {
	readonly kind: "curve";
	readonly beat: number;
	readonly durationBeats: number;
	readonly values: Float32Array;
}

type AbsoluteKeyframe = AbsolutePointKeyframe | AbsoluteCurveKeyframe;

interface AutomationClip {
	readonly startBeat: number;
	readonly endBeat: number;
	readonly paths: ReadonlyArray<string>;
	readonly keyframes: ReadonlyArray<AbsoluteKeyframe>;
	readonly finalValue: number;
}

export class AutomationScheduler {
	private clips: ReadonlyArray<AutomationClip> = [];
	private clipsByPathEnd = new Map<string, ReadonlyArray<AutomationClip>>();
	private cursor = 0;
	private readonly activeSet = new Set<AutomationClip>();
	private readonly cache = new Map<string, number>();
	private lastToBeats = -Infinity;

	setup(automations: ReadonlyArray<PositionedAutomation>): void {
		const clips: Array<AutomationClip> = [];

		for (const { beat, automation } of automations) {
			if (!Array.isArray(automation.source)) continue;
			const paths = automation.paths.filter((path) => path !== "tempo");
			if (paths.length === 0) continue;

			const keyframes: Array<AbsoluteKeyframe> = automation.envelope.map((kf) => {
				if (kf.kind === "curve") {
					return { kind: "curve" as const, beat: beat + kf.timeBeats, durationBeats: kf.durationBeats, values: kf.values };
				}
				return { kind: "point" as const, beat: beat + kf.timeBeats, value: kf.value, curve: kf.curve };
			});

			clips.push({
				startBeat: beat,
				endBeat: beat + automation.durationBeats,
				paths,
				keyframes,
				finalValue: evaluateAt(keyframes, beat + automation.durationBeats),
			});
		}

		clips.sort((left, right) => left.startBeat - right.startBeat);
		this.clips = clips;

		const byPathEnd = new Map<string, Array<AutomationClip>>();
		for (const clip of clips) {
			for (const path of clip.paths) {
				let list = byPathEnd.get(path);
				if (!list) {
					list = [];
					byPathEnd.set(path, list);
				}
				list.push(clip);
			}
		}
		for (const list of byPathEnd.values()) {
			list.sort((left, right) => left.endBeat - right.endBeat);
		}
		this.clipsByPathEnd = byPathEnd;

		this.cache.clear();
		this.activeSet.clear();
		this.cursor = 0;
		this.lastToBeats = -Infinity;
	}

	scheduleWindow(fromBeats: number, toBeats: number, context: ScheduleContext): void {
		const isAdjacent = Math.abs(fromBeats - this.lastToBeats) < ADJACENCY_EPSILON;

		if (isAdjacent) {
			this.advanceCursor(toBeats);
		} else {
			this.seek(fromBeats, toBeats, context);
		}

		for (const clip of this.activeSet) {
			this.scheduleClip(clip, fromBeats, toBeats, context);
		}

		const finished: Array<AutomationClip> = [];
		for (const clip of this.activeSet) {
			if (clip.endBeat <= toBeats) {
				finished.push(clip);
			}
		}
		for (const clip of finished) {
			for (const path of clip.paths) {
				this.cache.set(path, clip.finalValue);
			}
			this.activeSet.delete(clip);
		}

		this.lastToBeats = toBeats;
	}

	reset(): void {
		this.clips = [];
		this.clipsByPathEnd.clear();
		this.cursor = 0;
		this.activeSet.clear();
		this.cache.clear();
		this.lastToBeats = -Infinity;
	}

	private advanceCursor(toBeats: number): void {
		let clip = this.clips[this.cursor];
		while (clip && clip.startBeat < toBeats) {
			this.activeSet.add(clip);
			this.cursor++;
			clip = this.clips[this.cursor];
		}
	}

	private seek(fromBeats: number, toBeats: number, context: ScheduleContext): void {
		this.cursor = lowerBound(this.clips, fromBeats, (clip) => clip.startBeat);

		this.activeSet.clear();
		for (let ci = 0; ci < this.cursor; ci++) {
			const clip = this.clips[ci];
			if (clip && clip.endBeat > fromBeats) {
				this.activeSet.add(clip);
			}
		}

		this.advanceCursor(toBeats);

		this.cache.clear();
		for (const [path, clips] of this.clipsByPathEnd) {
			const lastCompleted = lastBefore(clips, fromBeats, (clip) => clip.endBeat);
			if (lastCompleted) {
				this.cache.set(path, lastCompleted.finalValue);
			}
		}

		const windowStartSeconds = beatsToSeconds(fromBeats, context.tempoMap);
		for (const [path, value] of this.cache) {
			const driver = context.driverMap.get(path);
			if (driver) {
				driver.offset.setValueAtTime(value, windowStartSeconds);
			}
		}
	}

	private scheduleClip(clip: AutomationClip, fromBeats: number, toBeats: number, context: ScheduleContext): void {
		const evalBeat = Math.max(fromBeats, clip.startBeat);
		const initialValue = evaluateAt(clip.keyframes, evalBeat);
		const evalSeconds = beatsToSeconds(evalBeat, context.tempoMap);

		for (const path of clip.paths) {
			const driver = context.driverMap.get(path);
			if (!driver) continue;

			driver.offset.setValueAtTime(initialValue, evalSeconds);

			for (const kf of clip.keyframes) {
				if (kf.beat < fromBeats || kf.beat >= toBeats) continue;

				const timeSeconds = beatsToSeconds(kf.beat, context.tempoMap);

				if (kf.kind === "curve") {
					const endSeconds = beatsToSeconds(kf.beat + kf.durationBeats, context.tempoMap);
					driver.offset.setValueCurveAtTime(kf.values, timeSeconds, endSeconds - timeSeconds);
				} else {
					schedulePointKeyframe(driver.offset, kf, timeSeconds);
				}
			}

			if (clip.endBeat > toBeats) {
				this.clipRampAtBoundary(clip, toBeats, driver.offset, context);
			}
		}
	}

	private clipRampAtBoundary(clip: AutomationClip, toBeats: number, param: AudioParam, context: ScheduleContext): void {
		const nextKeyframe = firstPointAt(clip.keyframes, toBeats);
		if (!nextKeyframe) return;

		const curve = nextKeyframe.curve ?? "step";
		if (curve === "step") return;

		const clippedValue = evaluateAt(clip.keyframes, toBeats);
		const toSeconds = beatsToSeconds(toBeats, context.tempoMap);

		if (curve === "linear") {
			param.linearRampToValueAtTime(clippedValue, toSeconds);
		} else {
			param.exponentialRampToValueAtTime(Math.max(clippedValue, 1e-6), toSeconds);
		}
	}
}

function schedulePointKeyframe(param: AudioParam, kf: AbsolutePointKeyframe, timeSeconds: number): void {
	const curve = kf.curve ?? "step";

	if (curve === "step") {
		param.setValueAtTime(kf.value, timeSeconds);
	} else if (curve === "linear") {
		param.linearRampToValueAtTime(kf.value, timeSeconds);
	} else {
		param.exponentialRampToValueAtTime(Math.max(kf.value, 1e-6), timeSeconds);
	}
}

function evaluateAt(keyframes: ReadonlyArray<AbsoluteKeyframe>, beat: number): number {
	let prevValue = 0;
	let prevBeat = 0;

	for (const kf of keyframes) {
		if (kf.kind !== "point") continue;

		if (kf.beat > beat) {
			const curve = kf.curve ?? "step";
			if (curve === "step") return prevValue;

			const fraction = (beat - prevBeat) / (kf.beat - prevBeat);

			if (curve === "linear") return prevValue + (kf.value - prevValue) * fraction;

			return prevValue * Math.pow(Math.max(kf.value / prevValue, 1e-6), fraction);
		}

		prevValue = kf.value;
		prevBeat = kf.beat;
	}

	return prevValue;
}

function firstPointAt(keyframes: ReadonlyArray<AbsoluteKeyframe>, beat: number): AbsolutePointKeyframe | undefined {
	for (const kf of keyframes) {
		if (kf.kind !== "point") continue;
		if (kf.beat >= beat) return kf;
	}
	return undefined;
}

function lastBefore<T>(sorted: ReadonlyArray<T>, target: number, key: (item: T) => number): T | undefined {
	let lo = 0;
	let hi = sorted.length - 1;
	let result: T | undefined;

	while (lo <= hi) {
		const mid = (lo + hi) >> 1;
		const item = sorted[mid];
		if (item !== undefined && key(item) <= target) {
			result = item;
			lo = mid + 1;
		} else {
			hi = mid - 1;
		}
	}

	return result;
}
