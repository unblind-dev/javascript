import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  external: ["react", "react-dom"],
  sourcemap: true,
  clean: true,
  onSuccess: "tsc --noEmit",
  minify: true,
  noExternal: ["uplot/dist/uPlot.min.css"],
});
