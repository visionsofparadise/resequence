import { existsSync } from "fs";
import { resolve } from "path";
import type { Instrument } from "./instrument/instrument";
import type { Pattern } from "./patterns/pattern";

export interface ValidationWarning {
	readonly code: string;
	readonly message: string;
}

export interface ValidateContext {
	insideRoute: boolean;
	routing: Map<string, Array<Instrument>>;
	automationPaths: Array<{ name: string; paths: Array<string> }>;
	warnings: Array<ValidationWarning>;
}

export function validate(pattern: Pattern, options?: { projectDir?: string }): Array<ValidationWarning> {
	const context: ValidateContext = {
		insideRoute: false,
		routing: new Map(),
		automationPaths: [],
		warnings: [],
	};

	pattern.validate(context);

	for (const entry of context.automationPaths) {
		for (const path of entry.paths) {
			const instrumentName = path.split(".")[0]!;
			if (!context.routing.has(instrumentName)) {
				context.warnings.push({
					code: "ORPHANED_AUTOMATION",
					message: `Automation '${entry.name}' targets '${instrumentName}' which has no routing in the tree`,
				});
			}
		}
	}

	for (const [name, instances] of context.routing) {
		const unique = new Set(instances);
		if (unique.size > 1) {
			context.warnings.push({
				code: "DUPLICATE_ROUTING_NAME",
				message: `Instrument name '${name}' is defined multiple times — first instance wins`,
			});
		}
	}

	if (options?.projectDir) {
		const samplePaths = new Set<string>();
		const sampleSources = new Map<string, string>();

		for (const [name, instances] of context.routing) {
			const inst = instances[0]!;
			if (inst.type === "instrument") {
				for (const zone of inst.zones) {
					samplePaths.add(zone.sample);
					sampleSources.set(zone.sample, name);
				}
			} else if (inst.mapping) {
				for (const [, entry] of Object.entries(inst.mapping)) {
					if (typeof entry === "string") {
						samplePaths.add(entry);
						sampleSources.set(entry, name);
					} else {
						for (const layer of entry) {
							samplePaths.add(layer.sample);
							sampleSources.set(layer.sample, name);
						}
					}
				}
			}

			if (inst.effects) {
				for (const effect of Object.values(inst.effects)) {
					if ("impulse" in effect) {
						const impulse = (effect as { impulse: string }).impulse;
						samplePaths.add(impulse);
						sampleSources.set(impulse, name);
					}
				}
			}
		}

		for (const samplePath of samplePaths) {
			const resolved = resolve(options.projectDir, samplePath);
			if (!existsSync(resolved)) {
				context.warnings.push({
					code: "MISSING_SAMPLE",
					message: `Sample file not found: '${resolved}' (referenced by ${sampleSources.get(samplePath)})`,
				});
			}
		}
	}

	return context.warnings;
}
