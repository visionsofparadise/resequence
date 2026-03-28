import type { NoteEvent, SetupResult, UnitContext } from "@resequence/web-au-core";
import { getOrCreateDriver } from "@resequence/web-au-core";
import type { Pitch } from "@resequence/web-au-utils";
import { pitchToMidi, scheduleSlideRamps } from "@resequence/web-au-utils";

import { GeneratorUnit, type GeneratorUnitInput, type GeneratorUnitProperties } from "./generator";

export interface SamplerZone {
	readonly sample: string;
	readonly region?: string;
	readonly root?: Pitch;
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

export interface SamplerProperties extends GeneratorUnitProperties {
	readonly config: SamplerConfig;
}

export class SamplerUnit extends GeneratorUnit {
	readonly type = ["unit", "midi", "generator", "sampler"] as const;
	declare readonly properties: SamplerProperties;

	static override is(value: unknown): value is SamplerUnit {
		return GeneratorUnit.is(value) && value.type[3] === "sampler";
	}

	private readonly buffers = new Map<string, AudioBuffer>();

	constructor(properties: GeneratorUnitInput<SamplerProperties>) {
		super(properties);
		this.properties = {
			...properties,
			targets: properties.targets ?? [],
			modDeclarations: properties.modDeclarations ?? [],
			noteModDeclarations: properties.noteModDeclarations ?? [],
			voiceToCallbacks: properties.voiceToCallbacks ?? [],
			voiceModDeclarations: properties.voiceModDeclarations ?? [],
		};
	}

	get config(): SamplerConfig { return this.properties.config; }

	protected override async _setup(context: UnitContext): Promise<SetupResult> {
		const result = await super._setup(context);

		const paths = this.collectSamplePaths();

		const results = await Promise.allSettled(
			paths.map(async (path) => {
				const buffer = await context.getSample(path);

				return {
					path,
					buffer,
				};
			}),
		);

		for (const settledResult of results) {
			if (settledResult.status === "fulfilled") {
				this.buffers.set(settledResult.value.path, settledResult.value.buffer);
			} else {
				console.warn(`sampler: failed to load sample: ${settledResult.reason}`);
			}
		}

		if (this.id) {
			getOrCreateDriver(`${this.id}.frequency`, 0, context, [20, 20000]);
			getOrCreateDriver(`${this.id}.detune`, 0.5, context, [-1200, 1200]);
		}

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

	protected override _schedule(noteEvent: NoteEvent, context: UnitContext): void {
		const ne = this.offsetNote(noteEvent, context);
		const midiNote = ne.note;
		const result = this.selectSample(midiNote, ne.velocity);

		if (!result) return;

		const source = context.audioContext.createBufferSource();

		source.buffer = result.buffer;
		source.playbackRate.value = result.playbackRate;

		if (ne.slides && ne.slides.length > 0) {
			scheduleSlideRamps(source.playbackRate, result.playbackRate, ne.slides, ne.startMs / 1000, (cents) => result.playbackRate * 2 ** (cents / 1200));
		}

		if (result.loopStartMs !== undefined && result.loopEndMs !== undefined) {
			source.loop = true;
			source.loopStart = result.loopStartMs / 1000;
			source.loopEnd = result.loopEndMs / 1000;
		}

		if (this.id) {
			const detuneEntry = context.driverMap.get(`${this.id}.detune`);

			if (detuneEntry) {
				const scaleGain = context.audioContext.createGain();

				scaleGain.gain.value = 2400;
				source.detune.value = -1200;
				detuneEntry.node.connect(scaleGain);
				scaleGain.connect(source.detune);
			}
		}

		source.start(ne.startMs / 1000);
		source.stop(ne.cleanupMs / 1000);

		const cleanup = this.scheduleVoice([source], ne, context);

		source.addEventListener("ended", cleanup);
	}

	private selectSample(midiNote: number, velocity: number): ResolvedSample | null {
		if (this.config.kind === "single") {
			const buffer = this.buffers.get(this.config.path);

			if (!buffer) return null;

			const playbackRate = this.config.rootMidi !== undefined ? 2 ** ((midiNote - this.config.rootMidi) / 12) : 1;

			return { buffer, playbackRate, loopStartMs: this.config.loopStartMs, loopEndMs: this.config.loopEndMs };
		}

		return resolveFromZones(this.config.zones, midiNote, velocity, this.buffers);
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

		return new SamplerUnit({ id, config: { kind: "single", path: source, rootMidi, loopStartMs: options?.loopStartMs, loopEndMs: options?.loopEndMs } });
	}

	if (source.length === 0) throw new Error("sampler(): zones array must not be empty");

	const zones = source.map(normalizeZone);

	return new SamplerUnit({ id, config: { kind: "zones", zones } });
}
