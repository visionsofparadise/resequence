import type { Event, NoteEvent as PatternNoteEvent, TempoMap } from "@resequence/patterns";
import { collectMetadata } from "@resequence/patterns";
import type { DriverEntry, UnitContext } from "@resequence/web-au";
import { createUnitContext } from "@resequence/web-au";
import type { AudioEvent } from "./constructs/audio";
import { isAudioEvent, isPreloadAudioEvent } from "./constructs/audio";
import type { AutomationEvent } from "./constructs/automate";
import { isAutomationEvent } from "./constructs/automate";
import { dispatchAudioCue, dispatchAudioSetup } from "./dispatch/audio";
import { dispatchAutomation } from "./dispatch/automation";
import { seekAutomationFromEvents } from "./dispatch/seek";
import { mapNoteEvent } from "./mapping";
import { loadSample } from "./rendering/load-sample";
import type { Router } from "./router";
import { lowerBound } from "./utils/sorted";

export type PlaybackState = "playing" | "paused" | "stopped";

interface PlaybackEventMap {
	note: (note: PatternNoteEvent, beat: number) => void;
	marker: (name: string, beat: number) => void;
	statechange: (state: PlaybackState) => void;
}

export interface PlaybackOptions {
	readonly lookaheadMs?: number;
	readonly tickMs?: number;
	readonly include?: ReadonlyArray<string>;
	readonly exclude?: ReadonlyArray<string>;
}

const DEFAULT_LOOKAHEAD_MS = 100;
const DEFAULT_TICK_MS = 25;

export class Playback {
	private readonly router: Router;
	private readonly audioContext: AudioContext;
	private readonly options: PlaybackOptions;
	private readonly listeners: { [K in keyof PlaybackEventMap]: Array<PlaybackEventMap[K]> } = {
		note: [],
		marker: [],
		statechange: [],
	};

	private readonly sampleCache = new Map<string, AudioBuffer>();
	private unitContext: UnitContext | undefined;
	private tempoMap: TempoMap = [];
	private markers: ReadonlyArray<{ beat: number; name: string }> = [];
	private allAutomationEvents: ReadonlyArray<AutomationEvent> = [];
	private markerCursor = 0;
	private scheduledToBeats = 0;
	private startedAtSeconds = 0;
	private startedAtBeats = 0;
	private tickTimer: ReturnType<typeof setInterval> | undefined;
	private _state: PlaybackState = "stopped";
	private patternEndBeat = 0;

	constructor(router: Router, audioContext: AudioContext, options: PlaybackOptions = {}) {
		this.router = router;
		this.audioContext = audioContext;
		this.options = options;
	}

	get state(): PlaybackState {
		return this._state;
	}

	get drivers(): ReadonlyMap<string, DriverEntry> {
		return this.unitContext?.driverMap ?? new Map();
	}

	get beat(): number {
		if (this._state !== "playing") return this.startedAtBeats;

		const elapsedSeconds = this.audioContext.currentTime - this.startedAtSeconds;

		return secondsToBeats(this.startedAtBeats, elapsedSeconds, this.tempoMap);
	}

	on<K extends keyof PlaybackEventMap>(event: K, callback: PlaybackEventMap[K]): void {
		this.listeners[event].push(callback);
	}

	off<K extends keyof PlaybackEventMap>(event: K, callback: PlaybackEventMap[K]): void {
		const list = this.listeners[event];
		const index = list.indexOf(callback);

		if (index !== -1) list.splice(index, 1);
	}

	async setup(getSample: (path: string) => Promise<ArrayBuffer>): Promise<void> {
		const pattern = this.router.pattern;

		if (!pattern) throw new Error("Router has no pattern");

		const setupEvents = pattern.setup(0);

		for (const event of setupEvents) {
			if (!isPreloadAudioEvent(event)) continue;

			const buffer = await dispatchAudioSetup(event, async (path: string) => {
				const cached = this.sampleCache.get(path);

				if (cached) return cached;

				const buf = await loadSample(path, this.audioContext, getSample);
				this.sampleCache.set(path, buf);

				return buf;
			});

			if (buffer) this.sampleCache.set(event.sampleKey, buffer);
		}

		const metadata = collectMetadata(setupEvents);
		this.tempoMap = metadata.tempoMap;
		this.markers = metadata.markers;
		this.patternEndBeat = pattern.endBeat - pattern.startBeat;

		const unitContext = createUnitContext(
			this.audioContext,
			async (path: string) => {
				const cached = this.sampleCache.get(path);
				if (cached) return cached;
				const buf = await loadSample(path, this.audioContext, getSample);
				this.sampleCache.set(path, buf);
				return buf;
			},
			async (url: string) => {
				await this.audioContext.audioWorklet.addModule(url);
			},
		);

		for (const [, unit] of this.router.ports) {
			await unit.setup(unitContext);
		}

		this.unitContext = unitContext;
	}

	async play(startBeat = 0): Promise<void> {
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
		this.startedAtBeats = beat;
		this.scheduledToBeats = beat;
		this.startedAtSeconds = this.audioContext.currentTime;
		this.markerCursor = lowerBound(this.markers, beat, (marker) => marker.beat);
		seekAutomationFromEvents(this.allAutomationEvents, beat, this.unitContext?.driverMap ?? new Map(), this.tempoMap);
	}

	stop(): void {
		if (this._state === "stopped") return;

		this.stopTicking();
		this.startedAtBeats = 0;
		this.scheduledToBeats = 0;
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
		if (this._state !== "playing") return;

		const pattern = this.router.pattern;

		if (!pattern) return;

		const lookaheadMs = this.options.lookaheadMs ?? DEFAULT_LOOKAHEAD_MS;
		const currentBeat = this.beat;
		const lookaheadSeconds = lookaheadMs / 1000;
		const lookaheadBeat = secondsToBeats(currentBeat, lookaheadSeconds, this.tempoMap);

		if (lookaheadBeat <= this.scheduledToBeats) return;

		const fromBeats = this.scheduledToBeats;
		const toBeats = Math.min(lookaheadBeat, this.patternEndBeat);

		const events = pattern.schedule(0, fromBeats, toBeats);

		const noteEvents: Array<PatternNoteEvent> = [];
		const automationEvents: Array<AutomationEvent> = [];
		const audioEvents: Array<AudioEvent> = [];

		for (const event of events) {
			if (isNoteEvent(event)) noteEvents.push(event);
			else if (isAutomationEvent(event)) automationEvents.push(event);
			else if (isAudioEvent(event)) audioEvents.push(event);
		}

		this.allAutomationEvents = [...this.allAutomationEvents, ...automationEvents];

		const portKeys = filterPorts(Array.from(this.router.ports.keys()), this.options.include, this.options.exclude);

		for (const portKey of portKeys) {
			const unit = this.router.ports.get(portKey);

			if (!unit) continue;

			const portNotes = noteEvents.filter((ev) => ev.port === portKey);

			for (const noteEvent of portNotes) {
				const note = mapNoteEvent(noteEvent, this.tempoMap);
				this.emitNoteEvent(noteEvent, noteEvent.startBeat);
				if (this.unitContext) unit.schedule(note, this.unitContext);
			}
		}

		const totalBeats = this.patternEndBeat;

		for (const automationEvent of automationEvents) {
			dispatchAutomation(automationEvent, this.unitContext?.driverMap ?? new Map(), this.audioContext, this.tempoMap, fromBeats, totalBeats);
		}

		for (const cueEvent of audioEvents) {
			const buffer = this.sampleCache.get(cueEvent.sampleKey);

			if (buffer) {
				dispatchAudioCue(cueEvent, buffer, this.audioContext, this.tempoMap, this.audioContext.destination);
			}
		}

		this.emitMarkerEvents(fromBeats, toBeats);
		this.scheduledToBeats = toBeats;

		if (toBeats >= this.patternEndBeat) {
			this.stopTicking();
			this.setState("stopped");
		}
	}

	private emitNoteEvent(note: PatternNoteEvent, beat: number): void {
		for (const listener of this.listeners.note) {
			listener(note, beat);
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

export function play(router: Router, audioContext: AudioContext, options?: PlaybackOptions): Playback {
	return new Playback(router, audioContext, options);
}

function isNoteEvent(event: Event): event is PatternNoteEvent {
	return event.type === "note";
}

function filterPorts(keys: ReadonlyArray<string>, include?: ReadonlyArray<string>, exclude?: ReadonlyArray<string>): ReadonlyArray<string> {
	let filtered = [...keys];

	if (include && include.length > 0) {
		const set = new Set(include);
		filtered = filtered.filter((key) => set.has(key));
	}

	if (exclude && exclude.length > 0) {
		const set = new Set(exclude);
		filtered = filtered.filter((key) => !set.has(key));
	}

	return filtered;
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
