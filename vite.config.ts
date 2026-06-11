import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// GitHub Pages serves a project site under /sawiyya/. Use relative base so the
// build works both at the repo root (custom domain) and under the project path.
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "spike.html"],
      workbox: {
        // Cache the app shell + the MediaPipe wasm/model so the recognizer
        // works offline after first load. Frames never leave the device.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2,wasm,task,json}"],
        maximumFileSizeToCacheInBytes: 30 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/(cdn\.jsdelivr\.net|storage\.googleapis\.com)\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "mediapipe-assets",
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
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
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
