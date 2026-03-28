import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { Command } from "commander";
import { Pattern } from "@resequence/patterns-core";
import { renderMidi } from "@resequence/patterns-utils";

const program = new Command();

program
	.name("resequence-patterns")
	.description("Export patterns to MIDI files")
	.command("export")
	.requiredOption("--input <file>", "Path to ts/js entry file")
	.option("--output <dir>", "Output directory", ".")
	.option("--ppq <number>", "Pulses per quarter note", "480")
	.action(async (options: { input: string; output: string; ppq: string }) => {
		const entrypoint = resolve(options.input);

		if (!existsSync(entrypoint)) {
			process.stderr.write(`Error: entrypoint not found: ${entrypoint}\n`);
			process.exit(1);
		}

		const outDir = resolve(options.output);
		const ppq = Number(options.ppq);

		mkdirSync(outDir, { recursive: true });

		process.stdout.write(`Evaluating ${entrypoint}...\n`);

		const { register } = await import("tsx/esm/api");
		const unregister = register();

		try {
			const mod = (await import(entrypoint)) as Record<string, unknown>;
			const pattern = mod.default;

			if (!(pattern instanceof Pattern)) {
				process.stderr.write("Error: default export must be a Pattern\n");
				process.exit(1);
			}

			const typedPattern = pattern as Pattern;

			process.stdout.write(`Pattern: duration=${typedPattern.endBeat - typedPattern.startBeat} beats\n`);

			const result = renderMidi(typedPattern, { ppq });

			for (const [portKey, data] of result) {
				const filePath = resolve(outDir, `${portKey}.mid`);

				writeFileSync(filePath, data);
				process.stdout.write(`  MIDI: ${portKey}.mid\n`);
			}

			process.stdout.write("Done.\n");
		} finally {
			await unregister();
		}
	});

program.parse();
