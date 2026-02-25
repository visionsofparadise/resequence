import { ResequenceError } from "../../error";
import type { ScheduleContext } from "../../rendering/schedule-context";
import { applyCC } from "../../rendering/schedule-notes";
import type { Pitch } from "../../utils/pitch";
import { pitchToMidi, resolvePitch } from "../../utils/pitch";
import type { Midi, MidiAudio, NoteContext } from "../node";
import { Node } from "../node";

export interface SamplerZone {
	readonly sample: string;
	readonly region?: string;
	readonly root?: string | number | Pitch;
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

export type SamplerMapping = Readonly<Record<string, string | ReadonlyArray<SamplerVelocityLayer>>>;

type SamplerConfig =
	| { readonly kind: "single"; readonly path: string; readonly rootMidi?: number; readonly loopStartMs?: number; readonly loopEndMs?: number }
	| { readonly kind: "mapping"; readonly mapping: SamplerMapping }
	| { readonly kind: "zones"; readonly zones: ReadonlyArray<NormalizedZone> };

interface NormalizedZone {
	readonly sample: string;
	readonly root?: Pitch;
	readonly velocity?: number;
	readonly loopStartMs?: number;
	readonly loopEndMs?: number;
}

export class SamplerNode extends Node<Midi, MidiAudio> {
	private readonly config: SamplerConfig;

	constructor(
		readonly id: string,
		config: SamplerConfig,
	) {
		super();

		this.config = config;
	}

	setup(_context: ScheduleContext): void {
		return;
	}

	prepare(_note: NoteContext, _context: ScheduleContext): void {
		return;
	}

	schedule(noteContext: NoteContext, scheduleContext: ScheduleContext): void {
		const midiNote = frequencyToMidi(noteContext.frequency);
		const result = this.resolve(midiNote, noteContext.velocity, scheduleContext.sampleMap);

		if (!result) return;

		const source = scheduleContext.audioContext.createBufferSource();
		source.buffer = result.buffer;
		source.playbackRate.value = result.playbackRate;

		if (result.loopStartMs !== undefined && result.loopEndMs !== undefined) {
			source.loop = true;
			source.loopStart = result.loopStartMs / 1000;
			source.loopEnd = result.loopEndMs / 1000;
		}

		source.start(noteContext.startTime);
		source.stop(noteContext.cleanupTime);

		const { node: chainEnd, cleanup } = applyCC(source, noteContext.cc, noteContext, scheduleContext);

		if (this.outputs.length === 0) {
			chainEnd.connect(scheduleContext.audioContext.destination);
		} else {
			for (const node of this.outputs) {
				node.schedule(chainEnd, noteContext, scheduleContext);
			}
		}

		source.addEventListener("ended", () => {
			cleanup();
			source.disconnect();
		});
	}

	private resolve(midiNote: number, velocity: number, sampleMap: ReadonlyMap<string, AudioBuffer>): ResolvedSample | null {
		if (this.config.kind === "single") {
			const buffer = sampleMap.get(this.config.path);
			if (!buffer) return null;

			const playbackRate = this.config.rootMidi !== undefined ? 2 ** ((midiNote - this.config.rootMidi) / 12) : 1;

			return { buffer, playbackRate, loopStartMs: this.config.loopStartMs, loopEndMs: this.config.loopEndMs };
		}

		if (this.config.kind === "mapping") {
			return resolveFromMapping(this.config.mapping, midiNote, velocity, sampleMap);
		}

		return resolveFromZones(this.config.zones, midiNote, velocity, sampleMap);
	}

	teardown(_context: ScheduleContext): void {
		return;
	}
}

interface ResolvedSample {
	readonly buffer: AudioBuffer;
	readonly playbackRate: number;
	readonly loopStartMs?: number;
	readonly loopEndMs?: number;
}

function resolveFromMapping(mapping: SamplerMapping, midiNote: number, velocity: number, sampleMap: ReadonlyMap<string, AudioBuffer>): ResolvedSample | null {
	const notes = Object.keys(mapping)
		.map((key) => ({ key, midi: pitchToMidi(resolvePitch(key)).note }))
		.sort((left, right) => left.midi - right.midi);

	if (notes.length === 0) return null;

	const firstNote = notes[0];

	if (!firstNote) return null;

	let selected = firstNote;

	for (const note of notes) {
		if (note.midi <= midiNote) selected = note;
		else break;
	}

	const entry = mapping[selected.key];

	if (!entry) return null;

	if (typeof entry === "string") {
		const buffer = sampleMap.get(entry);
		return buffer ? { buffer, playbackRate: 1 } : null;
	}

	const layer = selectVelocityLayer(entry, velocity);

	if (!layer) return null;

	const buffer = sampleMap.get(layer.sample);

	return buffer ? { buffer, playbackRate: 1, loopStartMs: layer.loopStartMs, loopEndMs: layer.loopEndMs } : null;
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

function frequencyToMidi(frequency: number): number {
	return Math.round(69 + 12 * Math.log2(frequency / 440));
}

function normalizeZone(zone: SamplerZone): NormalizedZone {
	const sample = zone.region && !zone.sample.includes("#") ? `${zone.sample}#${zone.region}` : zone.sample;
	const root = zone.root !== undefined ? resolvePitch(zone.root) : undefined;
	return { sample, root, velocity: zone.velocity, loopStartMs: zone.loopStartMs, loopEndMs: zone.loopEndMs };
}

function normalizeVelocityLayer(layer: SamplerVelocityLayer): SamplerVelocityLayer {
	const sample = layer.region && !layer.sample.includes("#") ? `${layer.sample}#${layer.region}` : layer.sample;
	return { sample, velocity: layer.velocity, loopStartMs: layer.loopStartMs, loopEndMs: layer.loopEndMs };
}

export function sampler(id: string, path: string, options?: { root: Pitch; loopStartMs?: number; loopEndMs?: number }): SamplerNode;
export function sampler(id: string, source: SamplerMapping | ReadonlyArray<SamplerZone>): SamplerNode;
export function sampler(id: string, source: string | SamplerMapping | ReadonlyArray<SamplerZone>, options?: { root: string | number | Pitch; loopStartMs?: number; loopEndMs?: number }): SamplerNode {
	if (!id) throw new ResequenceError("EMPTY_SAMPLER_ID", "sampler(): id must not be empty");

	if (typeof source === "string") {
		const rootMidi = options?.root !== undefined ? pitchToMidi(resolvePitch(options.root)).note : undefined;

		return new SamplerNode(id, { kind: "single", path: source, rootMidi, loopStartMs: options?.loopStartMs, loopEndMs: options?.loopEndMs });
	}

	if (Array.isArray(source)) {
		if (source.length === 0) throw new ResequenceError("EMPTY_SAMPLER_ZONES", "sampler(): zones array must not be empty");

		const zones = (source as ReadonlyArray<SamplerZone>).map(normalizeZone);

		return new SamplerNode(id, { kind: "zones", zones });
	}

	const mapping = source as SamplerMapping;

	if (Object.keys(mapping).length === 0) throw new ResequenceError("EMPTY_SAMPLER_MAPPING", "sampler(): mapping must not be empty");

	const normalizedMapping: Record<string, string | ReadonlyArray<SamplerVelocityLayer>> = {};

	for (const [key, value] of Object.entries(mapping)) {
		if (typeof value === "string") {
			normalizedMapping[key] = value;
		} else {
			normalizedMapping[key] = value.map(normalizeVelocityLayer);
		}
	}

	return new SamplerNode(id, { kind: "mapping", mapping: normalizedMapping as SamplerMapping });
}
