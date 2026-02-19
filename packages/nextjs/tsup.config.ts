import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/server/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  external: ["react", "react-dom"],
  sourcemap: true,
  clean: true,
  onSuccess: "tsc --noEmit",
  minify: true,
  noExternal: ["@unblind/react/styles.css"],
});
