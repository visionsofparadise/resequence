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

		return;
	}

	if ("child" in pattern && isPattern((pattern as { child: unknown }).child)) {
		walk((pattern as { child: Pattern }).child, routing);
	}

	if ("node" in pattern && isPattern((pattern as { node: unknown }).node)) {
		walk((pattern as { node: Pattern }).node, routing);
	}

	if ("children" in pattern && Array.isArray((pattern as { children: unknown }).children)) {
		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			if (isPattern(child)) walk(child, routing);
		}
	}
}

function isPattern(value: unknown): value is Pattern {
	return typeof value === "object" && value !== null && "type" in value && "durationTicks" in value;
}
