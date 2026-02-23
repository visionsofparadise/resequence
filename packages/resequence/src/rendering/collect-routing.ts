import type { EffectsChain } from "../instrument/effect";
import type { Instrument } from "../instrument/instrument";
import type { Pattern } from "../patterns/pattern";
import { RoutedPattern } from "../patterns/pattern";
import { SamplePattern } from "../patterns/sample";

export type RoutingEntry =
	| { readonly type: "instrument"; readonly instrument: Instrument; readonly effects?: EffectsChain }
	| { readonly type: "sample"; readonly name: string; readonly path: string; readonly effects?: EffectsChain };

export function collectRouting(pattern: Pattern): Map<string, RoutingEntry> {
	const routing = new Map<string, RoutingEntry>();

	walk(pattern, routing);

	return routing;
}

function walk(pattern: Pattern, routing: Map<string, RoutingEntry>): void {
	if (pattern instanceof RoutedPattern) {
		if (!routing.has(pattern.instrument.name)) {
			routing.set(pattern.instrument.name, { type: "instrument", instrument: pattern.instrument, effects: pattern.instrument.effects });
		}

		walk(pattern.node, routing);

		return;
	}

	if (pattern instanceof SamplePattern) {
		if (!routing.has(pattern.name)) {
			routing.set(pattern.name, { type: "sample", name: pattern.name, path: pattern.path, effects: pattern.effects });
		}

		return;
	}

	if ("node" in pattern && isPattern((pattern as { node: unknown }).node)) {
		walk((pattern as { node: Pattern }).node, routing);
	}

	if ("nodes" in pattern && Array.isArray((pattern as { nodes: unknown }).nodes)) {
		for (const child of (pattern as { nodes: ReadonlyArray<Pattern> }).nodes) {
			walk(child, routing);
		}
	}
}

function isPattern(value: unknown): value is Pattern {
	return typeof value === "object" && value !== null && "type" in value && "durationTicks" in value;
}
