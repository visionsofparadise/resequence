import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { Envelope, InstrumentZone, KitMapping } from "../instrument/instrument";
import type { Pitch } from "../utils/pitch";
import { resolvePitch } from "../utils/pitch";
import type { ScheduleContext } from "../rendering/schedule-context";
import { ticksToSeconds } from "../rendering/ticks-to-seconds";
import type { PositionedNote } from "./pattern";
import { MidiPattern } from "./pattern";

export class NotePattern extends MidiPattern {
	readonly type = "note" as const;
	readonly durationTicks: number;

	constructor(
		readonly pitch: Pitch,
		readonly duration: Duration,
		readonly velocity: number,
		readonly lyric?: string,
	) {
		super();

		this.durationTicks = resolveDuration(duration);
	}

	transpose(interval: number): NotePattern {
		const midi = resolvePitch(this.pitch) + interval;

		return new NotePattern(midi, this.duration, this.velocity, this.lyric);
	}

	reverse(): NotePattern {
		return new NotePattern(this.pitch, this.duration, this.velocity, this.lyric);
	}

	getMidi(offset = 0, trackName?: string): Array<PositionedNote> {
		return [
			{
				tick: offset,
				pitch: resolvePitch(this.pitch),
				durationTicks: this.durationTicks,
				velocity: this.velocity,
				lyric: this.lyric,
				trackName,
			},
		];
	}

	schedule(offsetTicks: number, context: ScheduleContext): void {
		if (offsetTicks + this.durationTicks <= context.fromTicks || offsetTicks >= context.toTicks) return;

		if (!context.instrument) return;

		const midi = resolvePitch(this.pitch);
		const offsetSeconds = ticksToSeconds(offsetTicks, context.tempo);
		const durationSeconds = ticksToSeconds(this.durationTicks, context.tempo);

		const inst = context.instrument;
		let buffer: AudioBuffer | undefined;
		let playbackRate = 1;

		if (inst.type === "instrument") {
			const zone = findZone(inst.zones, midi, this.velocity);

			if (!zone) return;

			buffer = context.sampleBank.get(zone.sample);

			const rootMidi = resolvePitch(zone.root);
			playbackRate = 2 ** ((midi - rootMidi) / 12);
		} else {
			const entry = inst.mapping ? findKitEntry(inst.mapping, this.pitch, this.velocity) : undefined;

			if (!entry) return;

			buffer = context.sampleBank.get(entry);
		}

		if (!buffer) return;

		const source = context.audioContext.createBufferSource();
		source.buffer = buffer;
		source.playbackRate.value = playbackRate;

		const effectsEntry = context.effectsMap.get(inst.name);
		const destination = effectsEntry?.input ?? context.audioContext.destination;

		if (inst.envelope) {
			const env = context.audioContext.createGain();

			env.gain.value = 0;
			scheduleAdsr(env.gain, offsetSeconds, durationSeconds, inst.envelope);
			source.connect(env);
			env.connect(destination);
		} else {
			source.connect(destination);
		}

		source.start(offsetSeconds);
		source.stop(offsetSeconds + durationSeconds);
	}
}

function findZone(zones: ReadonlyArray<InstrumentZone>, midi: number, velocity: number): InstrumentZone | undefined {
	const velocityMatches = zones.filter((zone) => !zone.velocity || (velocity >= zone.velocity[0] && velocity <= zone.velocity[1]));

	if (velocityMatches.length === 0) return zones[0];

	let closest = velocityMatches[0];
	let closestDist = Math.abs(resolvePitch(closest!.root) - midi);

	for (const zone of velocityMatches) {
		const dist = Math.abs(resolvePitch(zone.root) - midi);
		if (dist < closestDist) {
			closest = zone;
			closestDist = dist;
		}
	}

	return closest;
}

function findKitEntry(mapping: KitMapping, pitch: Pitch, velocity: number): string | undefined {
	const key = typeof pitch === "number" ? midiToName(pitch) : pitch;

	const entry = mapping[key];

	if (!entry) return undefined;
	if (typeof entry === "string") return entry;

	for (const layer of entry) {
		if (velocity >= layer.velocity[0] && velocity <= layer.velocity[1]) {
			return layer.sample;
		}
	}

	return entry[0]?.sample;
}

function midiToName(midi: number): string {
	const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
	const octave = Math.floor(midi / 12) - 1;
	const name = names[midi % 12];
	return `${name}${octave}`;
}

function scheduleAdsr(gain: AudioParam, startTime: number, duration: number, env: Envelope): void {
	const attack = env.attack ?? 0.01;
	const decay = env.decay ?? 0.1;
	const sustain = env.sustain ?? 0.7;
	const release = env.release ?? 0.1;

	gain.setValueAtTime(0, startTime);
	gain.linearRampToValueAtTime(1, startTime + attack);
	gain.linearRampToValueAtTime(sustain, startTime + attack + decay);
	gain.setValueAtTime(sustain, startTime + duration - release);
	gain.linearRampToValueAtTime(0, startTime + duration);
}

export function note(pitch: Pitch, duration: Duration, options?: { velocity?: number; lyric?: string }): NotePattern {
	return new NotePattern(pitch, duration, options?.velocity ?? 100, options?.lyric);
}
