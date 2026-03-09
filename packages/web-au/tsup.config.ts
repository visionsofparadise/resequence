import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: { index: "src/index.ts" },
		format: ["esm"],
		dts: true,
		treeshake: true,
		clean: true,
	},
	{
		entry: { cli: "src/cli.ts" },
		format: ["esm"],
		banner: { js: "#!/usr/bin/env node" },
		treeshake: true,
	},
	{
		entry: {
			"processors/bitcrush-processor": "src/processors/bitcrush-processor.js",
			"processors/downsample-processor": "src/processors/downsample-processor.js",
			"processors/noise-processor": "src/processors/noise-processor.js",
			"processors/envelope-processor": "src/processors/envelope-processor.js",
		},
		format: ["esm"],
		splitting: false,
	},
]);
