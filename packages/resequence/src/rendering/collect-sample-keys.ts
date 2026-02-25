import { AudioPattern } from "../patterns/audio";
import type { Pattern } from "../patterns/pattern";
import { SamplerNode } from "../nodes/generators/sampler";
import type { SamplerMapping, SamplerVelocityLayer } from "../nodes/generators/sampler";

export function collectSampleKeys(pattern: Pattern): ReadonlySet<string> {
	const keys = new Set<string>();
	walkPattern(pattern, keys);
	return keys;
}

function walkPattern(pattern: Pattern, keys: Set<string>): void {
	if (pattern instanceof AudioPattern) {
		keys.add(pattern.path);
	}

	collectNodeKeys(pattern, keys);

	if ("child" in pattern && isPattern((pattern as { child: unknown }).child)) {
		walkPattern((pattern as { child: Pattern }).child, keys);
	} else if ("children" in pattern && Array.isArray((pattern as { children: unknown }).children)) {
		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			if (isPattern(child)) walkPattern(child, keys);
		}
	}
}

function collectNodeKeys(pattern: Pattern, keys: Set<string>): void {
	if (!("outputs" in pattern) || !Array.isArray((pattern as { outputs: unknown }).outputs)) return;

	for (const node of (pattern as { outputs: ReadonlyArray<unknown> }).outputs) {
		walkNode(node, keys);
	}
}

function walkNode(node: unknown, keys: Set<string>): void {
	if (!(node instanceof SamplerNode)) {
		if (node instanceof Object && "outputs" in node && Array.isArray((node as { outputs: unknown }).outputs)) {
			for (const output of (node as { outputs: ReadonlyArray<unknown> }).outputs) {
				walkNode(output, keys);
			}
		}
		return;
	}

	const config = (node as unknown as { config: unknown }).config;
	if (!config || typeof config !== "object") return;

	const typedConfig = config as { kind: string; path?: string; mapping?: SamplerMapping; zones?: ReadonlyArray<{ sample: string }> };

	if (typedConfig.kind === "single" && typedConfig.path) {
		keys.add(typedConfig.path);
	} else if (typedConfig.kind === "mapping" && typedConfig.mapping) {
		for (const value of Object.values(typedConfig.mapping)) {
			if (typeof value === "string") {
				keys.add(value);
			} else if (Array.isArray(value)) {
				for (const layer of value as ReadonlyArray<SamplerVelocityLayer>) {
					keys.add(layer.sample);
				}
			}
		}
	} else if (typedConfig.kind === "zones" && typedConfig.zones) {
		for (const zone of typedConfig.zones) {
			keys.add(zone.sample);
		}
	}

	for (const output of node.outputs) {
		walkNode(output, keys);
	}
}

function isPattern(value: unknown): value is Pattern {
	return typeof value === "object" && value !== null && "type" in value && "durationBeats" in value;
}
