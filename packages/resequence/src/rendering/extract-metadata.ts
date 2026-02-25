import { MetadataPattern } from "../patterns/metadata";
import type { Pattern } from "../patterns/pattern";

export interface ExtractedMetadata {
	readonly name?: string;
	readonly description?: string;
}

export function extractMetadata(pattern: Pattern): ExtractedMetadata {
	const found = findMetadata(pattern);

	return {
		name: found?.name,
		description: found?.description,
	};
}

function findMetadata(pattern: Pattern): MetadataPattern | undefined {
	if (pattern instanceof MetadataPattern) return pattern;

	if ("child" in pattern && isPattern((pattern as { child: unknown }).child)) {
		return findMetadata((pattern as { child: Pattern }).child);
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
	return typeof value === "object" && value !== null && "type" in value && "durationBeats" in value;
}
