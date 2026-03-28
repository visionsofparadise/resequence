import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: {
			index: "src/index.ts",
			patterns: "src/patterns.ts",
			"patterns-core": "src/patterns-core.ts",
			"patterns-utils": "src/patterns-utils.ts",
			"web-au": "src/web-au.ts",
			"web-au-core": "src/web-au-core.ts",
			"web-au-utils": "src/web-au-utils.ts",
		},
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
]);
