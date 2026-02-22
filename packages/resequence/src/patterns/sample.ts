import type { Duration } from "../duration";
import { resolveDuration } from "../duration";
import type { EffectsChain } from "../effect";
import type { Pattern } from "./pattern";

export class SamplePattern implements Pattern {
	readonly type = "sample" as const;
	readonly durationTicks: number;

	constructor(
		readonly name: string,
		readonly path: string,
		readonly duration: Duration | undefined,
		readonly transposeSemitones: number,
		readonly reversed: boolean,
		readonly effects?: EffectsChain,
	) {
		this.durationTicks = duration !== undefined ? resolveDuration(duration) : 0;
	}

	transpose(interval: number): SamplePattern {
		return new SamplePattern(this.name, this.path, this.duration, this.transposeSemitones + interval, this.reversed, this.effects);
	}

	reverse(): SamplePattern {
		return new SamplePattern(this.name, this.path, this.duration, this.transposeSemitones, !this.reversed, this.effects);
	}

	routeTo(effectsChain: EffectsChain): SamplePattern {
		return new SamplePattern(this.name, this.path, this.duration, this.transposeSemitones, this.reversed, effectsChain);
	}
}

export function sample(name: string, path: string, duration?: Duration): SamplePattern {
	return new SamplePattern(name, path, duration, 0, false);
}
