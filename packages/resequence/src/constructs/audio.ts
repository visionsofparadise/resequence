import type { Event, PatternProperties } from "@resequence/patterns";
import { Pattern } from "@resequence/patterns";

export interface PreloadAudioEvent {
	readonly type: "preloadAudio";
	readonly sampleKey: string;
}

export interface AudioEvent {
	readonly type: "audio";
	readonly absoluteBeat: number;
	readonly name: string;
	readonly sampleKey: string;
	readonly durationBeats: number;
	readonly playFromBeats: number;
	readonly transposeSemitones: number;
	readonly reversed: boolean;
	readonly unitId?: string;
}

export interface AudioClipOptions {
	readonly region?: string;
	readonly playFromBeats?: number;
	readonly transpose?: number;
	readonly reversed?: boolean;
	readonly unitId?: string;
}

export function isPreloadAudioEvent(event: Event | { type: string }): event is PreloadAudioEvent {
	return event.type === "preloadAudio";
}

export function isAudioEvent(event: Event | { type: string }): event is AudioEvent {
	return event.type === "audio";
}

export interface AudioPatternProperties extends PatternProperties {
	readonly name: string;
	readonly sampleKey: string;
	readonly audioDurationBeats: number;
	readonly playFromBeats: number;
	readonly transposeSemitones: number;
	readonly reversed: boolean;
	readonly unitId?: string;
}

export class AudioPattern extends Pattern<AudioPatternProperties> {
	readonly type = ["pattern", "audio"] as const;

	static override is(value: unknown): value is AudioPattern {
		return Pattern.is(value) && value.type[1] === "audio";
	}

	override _setup(): Array<Event> {
		return [{ type: "preloadAudio", sampleKey: this.properties.sampleKey }];
	}

	override _schedule(absoluteBeat: number): Array<Event> {
		return [
			{
				type: "audio",
				absoluteBeat,
				name: this.properties.name,
				sampleKey: this.properties.sampleKey,
				durationBeats: this.properties.audioDurationBeats,
				playFromBeats: this.properties.playFromBeats,
				transposeSemitones: this.properties.transposeSemitones,
				reversed: this.properties.reversed,
				unitId: this.properties.unitId,
			},
		];
	}

	clone(overrides: Partial<PatternProperties>): AudioPattern {
		return new AudioPattern({
			...this.properties,
			...overrides,
			previousProperties: this.properties,
		});
	}
}

export function audio(name: string, path: string, duration: number, options?: AudioClipOptions): AudioPattern {
	if (!path) {
		throw new Error("audio(): path must not be empty");
	}

	const region = options?.region;
	const sampleKey = region && !path.includes("#") ? `${path}#${region}` : path;
	const playFromBeats = options?.playFromBeats ?? 0;

	return new AudioPattern({
		notes: [],
		children: [],
		startBeat: 0,
		endBeat: duration - playFromBeats,
		name,
		sampleKey,
		audioDurationBeats: duration,
		playFromBeats,
		transposeSemitones: options?.transpose ?? 0,
		reversed: options?.reversed ?? false,
		unitId: options?.unitId,
	});
}
