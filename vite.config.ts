import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves a project site under /sawiyya/. Use relative base so the
// build works both at the repo root (custom domain) and under the project path.
export default defineConfig({
  base: "./",
  // Inject a human-readable build stamp (UTC, to the minute) so the app can show
  // which build is live — makes stale-cache vs fresh-deploy diagnosable on-screen.
  define: {
    __BUILD__: JSON.stringify(new Date().toISOString().slice(0, 16).replace("T", " ")),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // M14: apple-touch-icon isn't manifest-referenced, so it needs an explicit
      // includeAssets entry to be copied + precached.
      includeAssets: ["favicon.svg", "apple-touch-icon.png"],
      workbox: {
        // Precache the app shell + the self-hosted MediaPipe wasm/model (H10) so
        // the recognizer runs OFFLINE FROM INSTALL — zero runtime CDN dependency.
        // Frames never leave the device. The 9.3MB no-SIMD wasm is vendored (still
        // zero CDN) but EXCLUDED from precache: every real 2026 target device has
        // WASM SIMD, so precaching both variants would spend ~9MB of install
        // bandwidth nobody uses — a legacy no-SIMD device does one local fetch on
        // first camera use instead.
        // L8: fonts are self-hosted now (public/fonts/, precached below via the
        // woff2 glob) — no more runtime CacheFirst rule for fonts.googleapis.com.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,wasm,task,json}"],
        globIgnores: ["**/vision_wasm_nosimd_internal.wasm"],
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
      },
      manifest: {
        name: "Sawiyya — Learn to sign, together",
        short_name: "Sawiyya",
        description:
          "Learn Qatari Sign Language. An on-device AI grades your own hands, privately. Teach the world, don't fix the child.",
        lang: "en",
        dir: "ltr",
        theme_color: "#0F6E6A",
        background_color: "#F6EFE3",
        display: "standalone",
        orientation: "portrait",
        start_url: "./",
        scope: "./",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          // L9: dedicated full-bleed maskable icon (glyph kept inside the W3C
          // safe-zone circle) — the "any" PNG has white corners + a tight glyph
          // that an Android adaptive-icon mask was clipping.
          { src: "icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
