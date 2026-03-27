import { defineConfig } from "tsup";

export default defineConfig([
	{
		entry: { index: "src/index.ts", "web-au": "src/web-au.ts" },
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
