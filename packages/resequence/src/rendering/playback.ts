import { seekAutomation } from "../automation/seek";
import type { ScoreNote } from "../patterns/note";
import type { Pattern } from "../patterns/pattern";
import { lowerBound } from "../utils/sorted";
import type { MarkerPoint } from "./pattern-metadata";
import { loadSample } from "./load-sample";
import type { PatternMetadata } from "./pattern-metadata";
import { collectMetadata } from "./pattern-metadata";
import type { ScheduleContext } from "./schedule-context";
import { scheduleNotes } from "./schedule-notes";

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
	readonly metadata?: PatternMetadata;
}

const DEFAULT_LOOKAHEAD_MS = 100;
const DEFAULT_TICK_MS = 25;

export class Playback {
	private readonly pattern: Pattern;
	private readonly audioContext: AudioContext;
	private readonly options: PlaybackOptions;
	private readonly listeners: { [K in keyof PlaybackEventMap]: Array<PlaybackEventMap[K]> } = {
		note: [],
		marker: [],
		statechange: [],
	};

	context: ScheduleContext | undefined;
	private markers: ReadonlyArray<MarkerPoint> = [];
	private markerCursor = 0;
	private scheduledToBeats = 0;
	private startedAtSeconds = 0;
	private startedAtBeats = 0;
	private tickTimer: ReturnType<typeof setInterval> | undefined;
	private _state: PlaybackState = "stopped";
	private pendingNoteEvents: Array<{ note: ScoreNote; beat: number }> = [];

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
		const driverMap: ScheduleContext["driverMap"] = new Map();
		const loadedModules = new Set<string>();
		const sampleCache = new Map<string, AudioBuffer>();
		const metadata = this.options.metadata ?? collectMetadata(this.pattern);
		const tempoMap = metadata.tempoMap;

		const baseContext: ScheduleContext = {
			audioContext: this.audioContext,
			driverMap,
			tempoMap,
			fromBeats: 0,
			toBeats: Infinity,
			trackFilter: this.options.trackFilter,
			outputs: [],
			dispatch: (note, offsetBeats, outputs, scheduleContext) => {
				const { trackFilter } = scheduleContext;
				const filtered = trackFilter
					? outputs.filter((output) => output.id !== undefined && trackFilter.has(output.id))
					: outputs;
				if (filtered.length === 0) return;
				scheduleNotes([note], offsetBeats, filtered, scheduleContext);

				this.pendingNoteEvents.push({ note, beat: offsetBeats + note.startBeat });
			},
			getSample: async (path: string) => {
				const cached = sampleCache.get(path);

				if (cached) return cached;

				const buffer = await loadSample(path, this.audioContext, fetchBuffer);

				sampleCache.set(path, buffer);

				return buffer;
			},
			loadModule: async (url: string) => {
				if (loadedModules.has(url)) return;

				await this.audioContext.audioWorklet.addModule(url);

				loadedModules.add(url);
			},
		};

		await this.pattern.setup(baseContext);

		this.markers = metadata.markers;
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
		seekAutomation(this.pattern, beat, this.context);
	}

	stop(): void {
		if (this._state === "stopped") return;

		this.stopTicking();
		this.startedAtBeats = 0;
		this.scheduledToBeats = 0;

		if (this.context) {
			this.pattern.teardown(this.context);
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
		const toBeats = Math.min(lookaheadBeat, this.pattern.endBeat - this.pattern.startBeat);

		this.pendingNoteEvents = [];
		const context = { ...this.context, fromBeats, toBeats };
		this.pattern.schedule(0, context);

		this.emitNoteEvents();
		this.emitMarkerEvents(fromBeats, toBeats);

		this.scheduledToBeats = toBeats;

		if (toBeats >= this.pattern.endBeat - this.pattern.startBeat) {
			this.stopTicking();
			this.setState("stopped");
		}
	}

	private emitNoteEvents(): void {
		if (this.listeners.note.length === 0) {
			this.pendingNoteEvents = [];
			return;
		}

		for (const { note, beat } of this.pendingNoteEvents) {
			for (const listener of this.listeners.note) {
				listener(note, beat);
			}
		}

		this.pendingNoteEvents = [];
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
