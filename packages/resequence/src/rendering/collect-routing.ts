import type { Pattern } from "../patterns/pattern";
import { AudioPattern } from "../patterns/audio";

export interface RoutingEntry {
	readonly type: "audio";
	readonly name: string;
	readonly path: string;
}

export function collectRouting(pattern: Pattern): Map<string, RoutingEntry> {
	const routing = new Map<string, RoutingEntry>();
	walk(pattern, routing);
	return routing;
}

function walk(pattern: Pattern, routing: Map<string, RoutingEntry>): void {
	if (pattern instanceof AudioPattern) {
		if (!routing.has(pattern.name)) {
			routing.set(pattern.name, { type: "audio", name: pattern.name, path: pattern.path });
		}
	}

	for (const { pattern: child } of pattern.children) {
		walk(child, routing);
	}
}
