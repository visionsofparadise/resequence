import { AutomationScheduler } from "../automation/scheduler";
import type { Pattern, ScoreNote } from "../patterns/pattern";
import type { MarkerPoint } from "./collect-markers";
import { collectMarkers } from "./collect-markers";
import { loadSample } from "./load-sample";
import type { ScheduleContext } from "./schedule-context";
import { buildTempoLog } from "./tempo-log";
import { lowerBound } from "../utils/sorted";

export type PlaybackState = "playing" | "paused" | "stopped";

interface PlaybackEventMap {
	note: (note: ScoreNote, beat: number) => void;
	marker: (name: string, beat: number) => void;
	statechange: (state: PlaybackState) => void;
}

interface PlaybackOptions {
	readonly trackFilter?: ReadonlySet<string>;
	readonly lookaheadMs?: number;
	readonly tickMs?: number;
}

const DEFAULT_LOOKAHEAD_MS = 100;
const DEFAULT_TICK_MS = 25;

export class Playback {
	private readonly pattern: Pattern;
	private readonly audioContext: AudioContext;
	private readonly options: PlaybackOptions;
	private readonly automationScheduler = new AutomationScheduler();
	private readonly listeners: { [K in keyof PlaybackEventMap]: Array<PlaybackEventMap[K]> } = {
		note: [],
		marker: [],
		statechange: [],
	};

	private context: ScheduleContext | undefined;
	private markers: ReadonlyArray<MarkerPoint> = [];
	private markerCursor = 0;
	private scheduledToBeats = 0;
	private startedAtSeconds = 0;
	private startedAtBeats = 0;
	private tickTimer: ReturnType<typeof setInterval> | undefined;
	private _state: PlaybackState = "stopped";

	constructor(pattern: Pattern, audioContext: AudioContext, options: PlaybackOptions = {}) {
		this.pattern = pattern;
		this.audioContext = audioContext;
		this.options = options;
	}

	get state(): PlaybackState {
		return this._state;
	}

	get beat(): number {
		if (this._state !== "playing" || !this.context) return this.startedAtBeats;

		const elapsedSeconds = this.audioContext.currentTime - this.startedAtSeconds;
		return secondsToBeats(this.startedAtBeats, elapsedSeconds, this.context.tempoMap);
	}

	on<K extends keyof PlaybackEventMap>(event: K, callback: PlaybackEventMap[K]): void {
		this.listeners[event].push(callback);
	}

	off<K extends keyof PlaybackEventMap>(event: K, callback: PlaybackEventMap[K]): void {
		const list = this.listeners[event];
		const index = list.indexOf(callback);
		if (index !== -1) list.splice(index, 1);
	}

	async setup(fetchBuffer: (path: string) => Promise<ArrayBuffer>): Promise<void> {
		const sampleKeys = this.pattern.sampleKeys;
		const tempoMap = buildTempoLog(this.pattern.metadatas, this.pattern.automations);

		const sampleMap = new Map<string, AudioBuffer>();
		for (const key of sampleKeys) {
			try {
				const audioBuffer = await loadSample(key, this.audioContext, fetchBuffer);
				sampleMap.set(key, audioBuffer);
			} catch {
				// sample not loadable — skip
			}
		}

		for (const url of this.pattern.moduleUrls) {
			await this.audioContext.audioWorklet.addModule(url);
		}

		const driverMap = new Map<string, ConstantSourceNode>();

		const baseContext: ScheduleContext = {
			audioContext: this.audioContext,
			sampleMap,
			driverMap,
			tempoMap,
			fromBeats: 0,
			toBeats: Infinity,
			trackFilter: this.options.trackFilter,
		};

		this.pattern.setup(baseContext);
		this.automationScheduler.setup(this.pattern.automations);
		this.markers = collectMarkers(this.pattern);
		this.context = baseContext;
	}

	async play(startBeat = 0): Promise<void> {
		if (!this.context) throw new Error("Playback: setup() must be called before play()");

		if (this._state === "paused") {
			await this.audioContext.resume();
			this.startedAtSeconds = this.audioContext.currentTime;
			this.setState("playing");
			this.startTicking();
			return;
		}

		if (this._state === "playing") return;

		await this.audioContext.resume();
		this.startedAtBeats = startBeat;
		this.scheduledToBeats = startBeat;
		this.startedAtSeconds = this.audioContext.currentTime;
		this.markerCursor = lowerBound(this.markers, startBeat, (marker) => marker.beat);
		this.setState("playing");
		this.startTicking();
	}

	async pause(): Promise<void> {
		if (this._state !== "playing") return;

		this.stopTicking();
		this.startedAtBeats = this.beat;
		await this.audioContext.suspend();
		this.setState("paused");
	}

	seek(beat: number): void {
		if (!this.context) return;

		this.startedAtBeats = beat;
		this.scheduledToBeats = beat;
		this.startedAtSeconds = this.audioContext.currentTime;
		this.markerCursor = lowerBound(this.markers, beat, (marker) => marker.beat);
	}

	stop(): void {
		if (this._state === "stopped") return;

		this.stopTicking();
		this.startedAtBeats = 0;
		this.scheduledToBeats = 0;

		if (this.context) {
			this.pattern.teardown(this.context);
			this.automationScheduler.reset();
			this.context = undefined;
		}

		this.setState("stopped");
	}

	private setState(state: PlaybackState): void {
		this._state = state;
		for (const listener of this.listeners.statechange) {
			listener(state);
		}
	}

	private startTicking(): void {
		const tickMs = this.options.tickMs ?? DEFAULT_TICK_MS;
		this.tick();
		this.tickTimer = setInterval(() => this.tick(), tickMs);
	}

	private stopTicking(): void {
		if (this.tickTimer !== undefined) {
			clearInterval(this.tickTimer);
			this.tickTimer = undefined;
		}
	}

	private tick(): void {
		if (!this.context || this._state !== "playing") return;

		const lookaheadMs = this.options.lookaheadMs ?? DEFAULT_LOOKAHEAD_MS;
		const currentBeat = this.beat;
		const lookaheadSeconds = lookaheadMs / 1000;
		const lookaheadBeat = secondsToBeats(currentBeat, lookaheadSeconds, this.context.tempoMap);

		if (lookaheadBeat <= this.scheduledToBeats) return;

		const fromBeats = this.scheduledToBeats;
		const toBeats = Math.min(lookaheadBeat, this.pattern.durationBeats);

		const context = { ...this.context, fromBeats, toBeats };
		this.automationScheduler.scheduleWindow(fromBeats, toBeats, context);
		this.pattern.schedule(0, context);

		this.emitNoteEvents(context);
		this.emitMarkerEvents(fromBeats, toBeats);

		this.scheduledToBeats = toBeats;

		if (toBeats >= this.pattern.durationBeats) {
			this.stopTicking();
			this.setState("stopped");
		}
	}

	private emitNoteEvents(context: ScheduleContext): void {
		if (this.listeners.note.length === 0) return;

		for (const note of this.pattern.notes) {
			if (note.beat >= context.fromBeats && note.beat < context.toBeats) {
				for (const listener of this.listeners.note) {
					listener(note, note.beat);
				}
			}
		}
	}

	private emitMarkerEvents(fromBeats: number, toBeats: number): void {
		if (this.listeners.marker.length === 0) return;

		let marker = this.markers[this.markerCursor];
		while (marker && marker.beat >= fromBeats && marker.beat < toBeats) {
			for (const listener of this.listeners.marker) {
				listener(marker.name, marker.beat);
			}
			this.markerCursor++;
			marker = this.markers[this.markerCursor];
		}
	}
}

function secondsToBeats(fromBeat: number, elapsedSeconds: number, tempoMap: ReadonlyArray<{ beat: number; bpm: number }>): number {
	let remaining = elapsedSeconds;
	let currentBeat = fromBeat;
	let bpm = 120;

	for (const point of tempoMap) {
		if (point.beat <= fromBeat) {
			bpm = point.bpm;
			continue;
		}
		if (point.beat > currentBeat) {
			const beatsAtTempo = point.beat - currentBeat;
			const secondsAtTempo = beatsAtTempo * (60 / bpm);
			if (remaining <= secondsAtTempo) {
				return currentBeat + remaining / (60 / bpm);
			}
			remaining -= secondsAtTempo;
			currentBeat = point.beat;
			bpm = point.bpm;
		}
	}

	return currentBeat + remaining / (60 / bpm);
}
