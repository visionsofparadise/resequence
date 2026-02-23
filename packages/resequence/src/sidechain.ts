import type { Duration } from "./duration";
import { invert } from "./invert";
import type { AutomationPoint } from "./patterns/automate";
import type { Pattern } from "./patterns/pattern";
import { trigger } from "./trigger";

export interface SidechainOptions {
	readonly depth: number;
	readonly attack: Duration;
	readonly release: Duration;
	readonly tension?: number;
}

export function sidechain(pattern: Pattern, options: SidechainOptions): Array<AutomationPoint> {
	return invert(
		trigger(pattern, {
			peak: options.depth,
			attack: options.attack,
			release: options.release,
			tension: options.tension,
		}),
	);
}
