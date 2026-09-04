import { MidiPattern } from "@resequence/patterns-core";
import type { Pattern } from "@resequence/patterns-core";

export interface ValidationWarning {
	readonly code: string;
	readonly message: string;
	readonly path: ReadonlyArray<number>;
}

export function validate(pattern: Pattern): ReadonlyArray<ValidationWarning> {
	const warnings: Array<ValidationWarning> = [];

	walkForValidation(pattern, [], false, warnings);

	return warnings;
}

function walkForValidation(
	pattern: Pattern,
	path: ReadonlyArray<number>,
	hasPort: boolean,
	warnings: Array<ValidationWarning>,
): void {
	const currentHasPort = hasPort || (pattern instanceof MidiPattern && pattern.ports.length > 0);

	if (pattern.properties.notes.length > 0 && !currentHasPort) {
		warnings.push({
			code: "ORPHANED_NOTES",
			message: `Pattern at path [${path.join(", ")}] has ${pattern.properties.notes.length} note(s) with no port routing`,
			path,
		});
	}

	for (let childIndex = 0; childIndex < pattern.properties.children.length; childIndex++) {
		const child = pattern.properties.children[childIndex];

		if (child) {
			walkForValidation(child.pattern, [...path, childIndex], currentHasPort, warnings);
		}
	}
}
