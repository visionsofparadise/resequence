import { build } from "esbuild";

export const bundleEntrypoint = async (entrypoint: string): Promise<string> => {
	const result = await build({
		entryPoints: [entrypoint],
		bundle: true,
		write: false,
		format: "esm",
		platform: "browser",
		packages: "bundle",
	});

	const output = result.outputFiles[0];

	if (!output) {
		throw new Error("esbuild produced no output files");
	}

	return output.text;
};
