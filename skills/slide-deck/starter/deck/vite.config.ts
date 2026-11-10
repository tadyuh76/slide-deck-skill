import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// The built deck is one self-contained HTML file (scripts, styles and fonts inlined) so it opens offline by
// double-click; images and videos stay next to it in img/, brand/ and media/.
export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile({ removeViteModuleLoader: true })],
  build: { assetsInlineLimit: 100_000_000, cssCodeSplit: false },
  server: { port: 5377, strictPort: true, host: "127.0.0.1" },
  preview: { port: 5378, strictPort: true, host: "127.0.0.1" },
});
