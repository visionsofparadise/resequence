import { ResequenceError } from "../error";
import { buildPerVoiceChain } from "../instrument/envelope";
import type { InstrumentZone, KitMapping } from "../instrument/instrument";
import type { ScheduleContext } from "../rendering/schedule-context";
import { ticksToSeconds } from "../rendering/ticks-to-seconds";
import type { Duration } from "../utils/duration";
import { resolveDuration } from "../utils/duration";
import type { Pitch } from "../utils/pitch";
import { resolvePitch } from "../utils/pitch";
import type { ValidateContext } from "../validate";
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

		if (velocity < 0 || velocity > 127) {
			throw new ResequenceError("INVALID_VELOCITY", `note(): velocity must be 0-127, got ${velocity}`);
		}

		this.durationTicks = resolveDuration(duration);
	}

	transpose(interval: number): NotePattern {
		const midi = resolvePitch(this.pitch) + interval;

		return new NotePattern(midi, this.duration, this.velocity, this.lyric);
	}

	reverse(): NotePattern {
		return new NotePattern(this.pitch, this.duration, this.velocity, this.lyric);
	}

	validate(context: ValidateContext): void {
		if (!context.insideRoute) {
			context.warnings.push({
				code: "ORPHANED_NOTES",
				message: `Note '${this.pitch}' is not routed to any instrument — it won't produce sound`,
			});
		}
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
		let loopStartMs: number | undefined;
		let loopEndMs: number | undefined;

		if (inst.type === "instrument") {
			const zone = findZone(inst.zones, midi, this.velocity);

			if (!zone) return;

			buffer = context.sampleBank.get(zone.sample);
			loopStartMs = zone.loopStartMs;
			loopEndMs = zone.loopEndMs;

			const rootMidi = resolvePitch(zone.root);
			playbackRate = 2 ** ((midi - rootMidi) / 12);
		} else {
			const entry = inst.mapping ? findKitEntry(inst.mapping, this.pitch, this.velocity) : undefined;

			if (!entry) return;

			buffer = context.sampleBank.get(entry.sample);
			loopStartMs = entry.loopStartMs;
			loopEndMs = entry.loopEndMs;
		}

		if (!buffer) return;

		const source = context.audioContext.createBufferSource();
		source.buffer = buffer;
		source.playbackRate.value = playbackRate;

		if (loopStartMs !== undefined && loopEndMs !== undefined) {
			source.loop = true;
			source.loopStart = loopStartMs / 1000;
			source.loopEnd = loopEndMs / 1000;
		}

		const destination = context.inputMap[inst.name] ?? context.audioContext.destination;
		const envelopes = context.envelopesMap[inst.name];

		let maxRelease = 0;

		if (envelopes) {
			const perVoice = buildPerVoiceChain(envelopes, source, context.audioContext, offsetSeconds, durationSeconds, context.tempo);
			maxRelease = perVoice.maxRelease;

			if (perVoice.input && perVoice.output) {
				source.connect(perVoice.input);
				perVoice.output.connect(destination);
			} else {
				source.connect(destination);
			}
		} else {
			source.connect(destination);
		}

		source.start(offsetSeconds);
		source.stop(offsetSeconds + durationSeconds + maxRelease);
	}
}

function findZone(zones: ReadonlyArray<InstrumentZone>, midi: number, velocity: number): InstrumentZone | undefined {
	const velocityMatches = zones.filter((zone) => !zone.velocity || (velocity >= zone.velocity[0] && velocity <= zone.velocity[1]));

	if (velocityMatches.length === 0) return zones[0];

	let closest = velocityMatches[0];

	if (!closest) return undefined;

	let closestDist = Math.abs(resolvePitch(closest.root) - midi);

	for (const zone of velocityMatches) {
		const dist = Math.abs(resolvePitch(zone.root) - midi);
		if (dist < closestDist) {
			closest = zone;
			closestDist = dist;
		}
	}

	return closest;
}

function findKitEntry(mapping: KitMapping, pitch: Pitch, velocity: number): { sample: string; loopStartMs?: number; loopEndMs?: number } | undefined {
	const key = typeof pitch === "number" ? midiToName(pitch) : pitch;

	const entry = mapping[key];

	if (!entry) return undefined;
	if (typeof entry === "string") return { sample: entry };

	for (const layer of entry) {
		if (velocity >= layer.velocity[0] && velocity <= layer.velocity[1]) {
			return { sample: layer.sample, loopStartMs: layer.loopStartMs, loopEndMs: layer.loopEndMs };
		}
	}

	const first = entry[0];

	return first ? { sample: first.sample, loopStartMs: first.loopStartMs, loopEndMs: first.loopEndMs } : undefined;
}

function midiToName(midi: number): string {
	const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
	const octave = Math.floor(midi / 12) - 1;
	const name = names[midi % 12];

	return `${name}${octave}`;
}

export function note(pitch: Pitch, duration: Duration, options?: { velocity?: number; lyric?: string }): NotePattern {
	return new NotePattern(pitch, duration, options?.velocity ?? 100, options?.lyric);
}
