import { ResequenceError } from "../../error";
import type { ScheduleContext } from "../../rendering/schedule-context";
import type { Pitch } from "../../utils/pitch";
import { pitchToMidi } from "../../utils/pitch";
import { scheduleSlideRamps } from "../../utils/schedule-slides";
import type { VoiceNote } from "../midi-unit";
import type { SetupResult } from "../unit";
import { GeneratorUnit } from "./generator";

export interface SamplerZone {
	readonly sample: string;
	readonly region?: string;
	readonly root?: Pitch;
	readonly velocity?: number;
	readonly loopStartMs?: number;
	readonly loopEndMs?: number;
}

export interface SamplerVelocityLayer {
	readonly sample: string;
	readonly region?: string;
	readonly velocity?: number;
	readonly loopStartMs?: number;
	readonly loopEndMs?: number;
}

type SamplerConfig =
	| { readonly kind: "single"; readonly path: string; readonly rootMidi?: number; readonly loopStartMs?: number; readonly loopEndMs?: number }
	| { readonly kind: "zones"; readonly zones: ReadonlyArray<NormalizedZone> };

interface NormalizedZone {
	readonly sample: string;
	readonly root?: Pitch;
	readonly velocity?: number;
	readonly loopStartMs?: number;
	readonly loopEndMs?: number;
}

export class SamplerUnit extends GeneratorUnit {
	private readonly config: SamplerConfig;

	constructor(
		public readonly id: string | undefined,
		config: SamplerConfig,
	) {
		super();
		this.config = config;
	}

	protected async _setup(context: ScheduleContext): Promise<SetupResult> {
		const result = await super._setup(context);

		const paths = this.collectSamplePaths();
		await Promise.all(paths.map((path) => context.getSample(path).catch(() => {})));

		return result;
	}

	private collectSamplePaths(): Array<string> {
		const paths: Array<string> = [];

		if (this.config.kind === "single") {
			paths.push(this.config.path);
		} else {
			for (const zone of this.config.zones) {
				paths.push(zone.sample);
			}
		}

		return paths;
	}

	protected _schedule(voiceNote: VoiceNote, scheduleContext: ScheduleContext): void {
		const midiNote = voiceNote.note;
		const result = this.selectSample(midiNote, voiceNote.velocity, scheduleContext.sampleMap);

		if (!result) return;

		const source = scheduleContext.audioContext.createBufferSource();
		source.buffer = result.buffer;
		source.playbackRate.value = result.playbackRate;

		if (voiceNote.slides && voiceNote.slides.length > 0) {
			scheduleSlideRamps(
				source.playbackRate,
				result.playbackRate,
				voiceNote.slides,
				voiceNote.startMs / 1000,
				(cents) => result.playbackRate * 2 ** (cents / 1200),
			);
		}

		if (result.loopStartMs !== undefined && result.loopEndMs !== undefined) {
			source.loop = true;
			source.loopStart = result.loopStartMs / 1000;
			source.loopEnd = result.loopEndMs / 1000;
		}

		source.start(voiceNote.startMs / 1000);
		source.stop(voiceNote.cleanupMs / 1000);

		const cleanup = this.scheduleVoice([source], voiceNote, scheduleContext);

		source.addEventListener("ended", cleanup);
	}

	private selectSample(midiNote: number, velocity: number, sampleMap: ReadonlyMap<string, AudioBuffer>): ResolvedSample | null {
		if (this.config.kind === "single") {
			const buffer = sampleMap.get(this.config.path);
			if (!buffer) return null;

			const playbackRate = this.config.rootMidi !== undefined ? 2 ** ((midiNote - this.config.rootMidi) / 12) : 1;

			return { buffer, playbackRate, loopStartMs: this.config.loopStartMs, loopEndMs: this.config.loopEndMs };
		}

		return resolveFromZones(this.config.zones, midiNote, velocity, sampleMap);
	}
}

interface ResolvedSample {
	readonly buffer: AudioBuffer;
	readonly playbackRate: number;
	readonly loopStartMs?: number;
	readonly loopEndMs?: number;
}

function resolveFromZones(zones: ReadonlyArray<NormalizedZone>, midiNote: number, velocity: number, sampleMap: ReadonlyMap<string, AudioBuffer>): ResolvedSample | null {
	if (zones.length === 0) return null;

	const anchored = zones.filter((zone): zone is NormalizedZone & { root: Pitch } => zone.root !== undefined).sort((left, right) => pitchToMidi(left.root).note - pitchToMidi(right.root).note);

	if (anchored.length === 0) {
		const zone = selectVelocityLayer(zones, velocity);

		if (!zone) return null;

		const buffer = sampleMap.get(zone.sample);

		return buffer ? { buffer, playbackRate: 1, loopStartMs: zone.loopStartMs, loopEndMs: zone.loopEndMs } : null;
	}

	const firstZone = anchored[0];

	if (!firstZone) return null;

	let selectedRoot = pitchToMidi(firstZone.root).note;

	for (const zone of anchored) {
		const rootMidi = pitchToMidi(zone.root).note;

		if (rootMidi <= midiNote) selectedRoot = rootMidi;
		else break;
	}

	const coRootZones = anchored.filter((zone) => pitchToMidi(zone.root).note === selectedRoot);
	const zone = selectVelocityLayer(coRootZones, velocity);

	if (!zone) return null;

	const playbackRate = 2 ** ((midiNote - selectedRoot) / 12);
	const buffer = sampleMap.get(zone.sample);

	return buffer ? { buffer, playbackRate, loopStartMs: zone.loopStartMs, loopEndMs: zone.loopEndMs } : null;
}

function selectVelocityLayer<T extends { velocity?: number }>(layers: ReadonlyArray<T>, velocity: number): T | undefined {
	if (layers.length === 0) return undefined;

	const sorted = [...layers].sort((left, right) => (left.velocity ?? 0) - (right.velocity ?? 0));

	const firstLayer = sorted[0];

	if (!firstLayer) return undefined;

	let selected = firstLayer;

	for (const layer of sorted) {
		if ((layer.velocity ?? 0) <= velocity) selected = layer;
		else break;
	}

	return selected;
}

function normalizeZone(zone: SamplerZone): NormalizedZone {
	const sample = zone.region && !zone.sample.includes("#") ? `${zone.sample}#${zone.region}` : zone.sample;
	return { sample, root: zone.root, velocity: zone.velocity, loopStartMs: zone.loopStartMs, loopEndMs: zone.loopEndMs };
}

export function sampler(source: string, options?: { root?: Pitch; loopStartMs?: number; loopEndMs?: number; id?: string }): SamplerUnit;
export function sampler(source: ReadonlyArray<SamplerZone>, options?: { id?: string }): SamplerUnit;
export function sampler(source: string | ReadonlyArray<SamplerZone>, options?: { root?: Pitch; loopStartMs?: number; loopEndMs?: number; id?: string }): SamplerUnit {

	const id = options?.id;

	if (typeof source === "string") {
		const rootMidi = options?.root !== undefined ? pitchToMidi(options.root).note : undefined;

		return new SamplerUnit(id, { kind: "single", path: source, rootMidi, loopStartMs: options?.loopStartMs, loopEndMs: options?.loopEndMs });
	}

	if (source.length === 0) throw new ResequenceError("EMPTY_SAMPLER_ZONES", "sampler(): zones array must not be empty");

	const zones = source.map(normalizeZone);

	return new SamplerUnit(id, { kind: "zones", zones });
}
