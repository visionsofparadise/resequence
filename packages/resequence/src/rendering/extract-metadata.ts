import { MetadataPattern } from "../patterns/metadata";
import type { Pattern } from "../patterns/pattern";

export interface ExtractedMetadata {
	readonly tempo: number;
	readonly key?: string;
	readonly timeSignature: [number, number];
}

export function extractMetadata(pattern: Pattern): ExtractedMetadata {
	const found = findMetadata(pattern);

	return {
		tempo: found?.tempo ?? 120,
		key: found?.key,
		timeSignature: found?.timeSignature ?? [4, 4],
	};
}

function findMetadata(pattern: Pattern): MetadataPattern | undefined {
	if (pattern instanceof MetadataPattern) return pattern;

	if ("node" in pattern && isPattern((pattern as { node: unknown }).node)) {
		return findMetadata((pattern as { node: Pattern }).node);
	}

	if ("children" in pattern && Array.isArray((pattern as { children: unknown }).children)) {
		for (const child of (pattern as { children: ReadonlyArray<Pattern> }).children) {
			const result = findMetadata(child);

			if (result) return result;
		}
	}

	return undefined;
}

function isPattern(value: unknown): value is Pattern {
	return typeof value === "object" && value !== null && "type" in value && "durationTicks" in value;
}
