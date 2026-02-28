import type { AnyKeyframe } from "../patterns/automate";
import type { Pattern } from "../patterns/pattern";
import { invert } from "./invert";
import { trigger } from "./trigger";

export interface SidechainOptions {
	readonly depth: number;
	readonly attack: number;
	readonly release: number;
	readonly tension?: number;
}

export function sidechain(pattern: Pattern, options: SidechainOptions): Array<AnyKeyframe> {
	return invert(
		trigger(pattern, {
			peak: options.depth,
			attack: options.attack,
			release: options.release,
			tension: options.tension,
		}),
	);
}
