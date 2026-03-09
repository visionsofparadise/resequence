import type { Event, NoteEvent as PatternNoteEvent, TempoMap } from "@resequence/patterns";
import { beatsToSeconds, collectMetadata } from "@resequence/patterns";
import type { MidiUnit, NoteEvent, UnitContext } from "@resequence/web-au";
import { createUnitContext } from "@resequence/web-au";
import type { AudioEvent } from "./constructs/audio";
import { isAudioEvent, isPreloadAudioEvent } from "./constructs/audio";
import type { AutomationEvent } from "./constructs/automate";
import { isAutomationEvent } from "./constructs/automate";
import { dispatchAutomation } from "./dispatch/automation";
import { dispatchAudioCue, dispatchAudioSetup } from "./dispatch/audio";
import { mapNoteEvent } from "./mapping";
import { encodeWav } from "./rendering/encode-wav";
import type { WavBitDepth } from "@resequence/web-au";
import { loadSample } from "./rendering/load-sample";
import type { Router } from "./router";

export interface RenderOptions {
	readonly output: string;
	readonly sampleRate?: number;
	readonly bitDepth?: WavBitDepth;
	readonly include?: ReadonlyArray<string>;
	readonly exclude?: ReadonlyArray<string>;
	readonly master?: boolean;
	readonly midiOnly?: boolean;
	readonly audioOnly?: boolean;
}

export interface RenderStemResult {
	readonly portKey: string;
	readonly buffer: AudioBuffer;
	readonly wav: ArrayBuffer;
}

export interface RenderResult {
	readonly stems: ReadonlyArray<RenderStemResult>;
	readonly master?: RenderStemResult;
	readonly tempoMap: TempoMap;
}

export async function render(
	router: Router,
	getSample: (path: string) => Promise<ArrayBuffer>,
	options: RenderOptions,
): Promise<RenderResult> {
	const pattern = router.pattern;
	if (!pattern) throw new Error("Router has no pattern");
	if (router.ports.size === 0) throw new Error("Router has no ports");

	const setupEvents = pattern.setup(0);
	const sampleRate = options.sampleRate ?? 44100;
	const dummyCtx = new OfflineAudioContext(2, sampleRate, sampleRate);
	const sampleCache = new Map<string, AudioBuffer>();

	for (const event of setupEvents) {
		if (!isPreloadAudioEvent(event)) continue;

		const buffer = await dispatchAudioSetup(event, async (path: string) => {
			const cached = sampleCache.get(path);
			if (cached) return cached;
			const buf = await loadSample(path, dummyCtx, getSample);
			sampleCache.set(path, buf);
			return buf;
		});
		if (buffer) sampleCache.set(event.sampleKey, buffer);
	}

	const allEvents = pattern.schedule(0, -Infinity, Infinity);

	const noteEvents: Array<PatternNoteEvent> = [];
	const automationEvents: Array<AutomationEvent> = [];
	const audioEvents: Array<AudioEvent> = [];

	for (const event of allEvents) {
		if (isNoteEvent(event)) noteEvents.push(event);
		else if (isAutomationEvent(event)) automationEvents.push(event);
		else if (isAudioEvent(event)) audioEvents.push(event);
	}

	const metadata = collectMetadata(allEvents);
	const tempoMap = metadata.tempoMap;
	const totalDurationSeconds = beatsToSeconds(pattern.endBeat - pattern.startBeat, tempoMap);
	const portKeys = filterPorts(Array.from(router.ports.keys()), options.include, options.exclude);
	const stems: Array<RenderStemResult> = [];

	for (const portKey of portKeys) {
		const unit = router.ports.get(portKey);
		if (!unit) continue;

		const stem = await renderPort(
			portKey, unit, noteEvents, automationEvents, audioEvents,
			tempoMap, totalDurationSeconds, sampleCache, options,
		);
		stems.push(stem);
	}

	return { stems, tempoMap };
}

async function renderPort(
	portKey: string,
	unit: MidiUnit,
	noteEvents: ReadonlyArray<PatternNoteEvent>,
	automationEvents: ReadonlyArray<AutomationEvent>,
	audioEvents: ReadonlyArray<AudioEvent>,
	tempoMap: TempoMap,
	totalDurationSeconds: number,
	sampleCache: ReadonlyMap<string, AudioBuffer>,
	options: RenderOptions,
): Promise<RenderStemResult> {
	const sampleRate = options.sampleRate ?? 44100;
	const portNotes = noteEvents.filter((ev) => ev.port === portKey);

	const length = Math.max(1, Math.ceil(totalDurationSeconds * sampleRate));
	const offlineCtx = new OfflineAudioContext(2, length, sampleRate);

	const unitContext = createUnitContext(
		offlineCtx,
		(path: string) => {
			const cached = sampleCache.get(path);
			if (cached) return Promise.resolve(cached);
			return Promise.reject(new Error(`Sample not found in cache: ${path}`));
		},
		(url: string) => offlineCtx.audioWorklet.addModule(url),
	);

	await unit.setup(unitContext);

	const totalBeats = totalDurationSeconds * (tempoMap[0]?.bpm ?? 120) / 60;

	for (const ne of portNotes) {
		const note = mapNoteEvent(ne, tempoMap);
		scheduleOnUnit(unit, note, unitContext);
	}

	for (const ae of automationEvents) {
		const isRelevant = ae.paths.some((path) => path.startsWith(portKey + "."));
		if (isRelevant) {
			dispatchAutomation(ae, unitContext.driverMap, offlineCtx, tempoMap, 0, totalBeats);
		}
	}

	for (const ce of audioEvents) {
		const buffer = sampleCache.get(ce.sampleKey);
		if (buffer) {
			dispatchAudioCue(ce, buffer, offlineCtx, tempoMap, offlineCtx.destination);
		}
	}

	const buffer = await offlineCtx.startRendering();
	const wav = encodeWav(buffer, undefined, tempoMap, undefined, options.bitDepth);

	unit.teardown(unitContext);

	return { portKey, buffer, wav };
}

function scheduleOnUnit(unit: MidiUnit, note: NoteEvent, context: UnitContext): void {
	unit.schedule(note, context);
}

function isNoteEvent(event: Event): event is PatternNoteEvent {
	return event.type === "note";
}

function filterPorts(
	keys: ReadonlyArray<string>,
	include?: ReadonlyArray<string>,
	exclude?: ReadonlyArray<string>,
): ReadonlyArray<string> {
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
