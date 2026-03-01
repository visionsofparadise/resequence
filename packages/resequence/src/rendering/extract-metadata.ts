import { MetadataPattern } from "../patterns/metadata";
import type { Pattern } from "../patterns/pattern";

export interface ExtractedMetadata {
	readonly name?: string;
	readonly description?: string;
}

export function extractMetadata(pattern: Pattern): ExtractedMetadata {
	const found = findMetadata(pattern);

	return {
		name: found?.properties.meta.name,
		description: found?.properties.meta.description,
	};
}

function findMetadata(pattern: Pattern): MetadataPattern | undefined {
	if (pattern instanceof MetadataPattern) return pattern;

	for (const { pattern: child } of pattern.children) {
		const result = findMetadata(child);
		if (result) return result;
	}

	return undefined;
}
