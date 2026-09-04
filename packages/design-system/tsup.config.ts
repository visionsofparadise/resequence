import { defineConfig } from "tsup";

export default defineConfig({
	entry: { index: "src/index.ts" },
	format: ["esm"],
	dts: true,
	treeshake: true,
	clean: true,
	external: ["react", "react-dom", "three", "@react-three/fiber", "@react-three/drei"],
});
