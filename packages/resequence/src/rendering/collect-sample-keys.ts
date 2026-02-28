import { AudioPattern } from "../patterns/audio";
import type { Pattern } from "../patterns/pattern";
import { MidiPattern } from "../patterns/pattern";
import type { SamplerMapping, SamplerVelocityLayer } from "../units/generators/sampler";
import { SamplerUnit } from "../units/generators/sampler";

export function collectSampleKeys(pattern: Pattern): ReadonlySet<string> {
	const keys = new Set<string>();
	walkPattern(pattern, keys);
	return keys;
}

function walkPattern(pattern: Pattern, keys: Set<string>): void {
	if (pattern instanceof AudioPattern) {
		keys.add(pattern.sampleKey);
	}

	if (pattern instanceof MidiPattern) {
		collectNodeKeys(pattern, keys);
	}

	for (const { pattern: child } of pattern.children) {
		walkPattern(child, keys);
	}
}

function collectNodeKeys(pattern: MidiPattern, keys: Set<string>): void {
	for (const node of pattern.outputs) {
		walkNode(node, keys);
	}
}

function walkNode(node: unknown, keys: Set<string>): void {
	if (!(node instanceof SamplerUnit)) {
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

	for (const target of node.targets) {
		walkNode(target, keys);
	}
}
