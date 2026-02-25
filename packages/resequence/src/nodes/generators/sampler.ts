import { ResequenceError } from "../../error";
import type { ScheduleContext } from "../../rendering/schedule-context";
import { applyCC } from "../../rendering/schedule-notes";
import type { Pitch } from "../../utils/pitch";
import { resolvePitch } from "../../utils/pitch";
import { Node } from "../node";
import type { Midi, MidiAudio, NoteContext } from "../node";

export interface SamplerZone {
	readonly sample: string;
	readonly root?: Pitch;
	readonly velocity?: number;
	readonly loopStartMs?: number;
	readonly loopEndMs?: number;
}

export interface SamplerVelocityLayer {
	readonly sample: string;
	readonly velocity?: number;
	readonly loopStartMs?: number;
	readonly loopEndMs?: number;
}

export type SamplerMapping = Readonly<Record<string, string | ReadonlyArray<SamplerVelocityLayer>>>;

type SamplerConfig =
	| { readonly kind: "single"; readonly path: string; readonly rootMidi?: number; readonly loopStartMs?: number; readonly loopEndMs?: number }
	| { readonly kind: "mapping"; readonly mapping: SamplerMapping }
	| { readonly kind: "zones"; readonly zones: ReadonlyArray<SamplerZone> };

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
	teardown(_context: ScheduleContext): void {
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
}

interface ResolvedSample {
	readonly buffer: AudioBuffer;
	readonly playbackRate: number;
	readonly loopStartMs?: number;
	readonly loopEndMs?: number;
}

function resolveFromMapping(mapping: SamplerMapping, midiNote: number, velocity: number, sampleMap: ReadonlyMap<string, AudioBuffer>): ResolvedSample | null {
	const notes = Object.keys(mapping)
		.map((key) => ({ key, midi: resolvePitch(key as Pitch) }))
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

function resolveFromZones(zones: ReadonlyArray<SamplerZone>, midiNote: number, velocity: number, sampleMap: ReadonlyMap<string, AudioBuffer>): ResolvedSample | null {
	if (zones.length === 0) return null;

	const anchored = zones.filter((zone): zone is SamplerZone & { root: Pitch } => zone.root !== undefined).sort((left, right) => resolvePitch(left.root) - resolvePitch(right.root));

	if (anchored.length === 0) {
		const zone = selectVelocityLayer(zones, velocity);

		if (!zone) return null;

		const buffer = sampleMap.get(zone.sample);

		return buffer ? { buffer, playbackRate: 1, loopStartMs: zone.loopStartMs, loopEndMs: zone.loopEndMs } : null;
	}

	const firstZone = anchored[0];
	if (!firstZone) return null;
	let selectedZone = firstZone;

	for (const zone of anchored) {
		if (resolvePitch(zone.root) <= midiNote) selectedZone = zone;
		else break;
	}

	const rootMidi = resolvePitch(selectedZone.root);
	const playbackRate = 2 ** ((midiNote - rootMidi) / 12);
	const buffer = sampleMap.get(selectedZone.sample);

	return buffer ? { buffer, playbackRate, loopStartMs: selectedZone.loopStartMs, loopEndMs: selectedZone.loopEndMs } : null;
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

export function sampler(id: string, path: string, options?: { root: Pitch; loopStartMs?: number; loopEndMs?: number }): SamplerNode;
export function sampler(id: string, source: SamplerMapping | ReadonlyArray<SamplerZone>): SamplerNode;
export function sampler(id: string, source: string | SamplerMapping | ReadonlyArray<SamplerZone>, options?: { root: Pitch; loopStartMs?: number; loopEndMs?: number }): SamplerNode {
	if (!id) throw new ResequenceError("EMPTY_SAMPLER_ID", "sampler(): id must not be empty");

	if (typeof source === "string") {
		const rootMidi = options?.root !== undefined ? resolvePitch(options.root) : undefined;

		return new SamplerNode(id, { kind: "single", path: source, rootMidi, loopStartMs: options?.loopStartMs, loopEndMs: options?.loopEndMs });
	}

	if (Array.isArray(source)) {
		if (source.length === 0) throw new ResequenceError("EMPTY_SAMPLER_ZONES", "sampler(): zones array must not be empty");

		return new SamplerNode(id, { kind: "zones", zones: source });
	}

	if (Object.keys(source).length === 0) throw new ResequenceError("EMPTY_SAMPLER_MAPPING", "sampler(): mapping must not be empty");

	return new SamplerNode(id, { kind: "mapping", mapping: source as SamplerMapping });
}
