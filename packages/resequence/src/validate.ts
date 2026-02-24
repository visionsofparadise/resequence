import type { Pattern } from "./patterns/pattern";

export interface ValidationWarning {
	readonly code: string;
	readonly message: string;
}

export interface ValidateContext {
	insideRoute: boolean;
	routing: Map<string, Array<unknown>>;
	automationPaths: Array<{ name: string; paths: Array<string> }>;
	warnings: Array<ValidationWarning>;
}

export function validate(pattern: Pattern, _options?: { projectDir?: string }): Array<ValidationWarning> {
	const context: ValidateContext = {
		insideRoute: false,
		routing: new Map(),
		automationPaths: [],
		warnings: [],
	};

	pattern.validate(context);

	return context.warnings;
}
