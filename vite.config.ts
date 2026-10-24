import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
const base = process.env.BASE_PATH || "/";
export default defineConfig({
  base,
  build: {
    // iOS 16 is the oldest Safari the app supports: its CSS uses container
    // query units (cqw), which arrived in Safari 16.0. Name it, so a newer
    // esbuild default never drops the transforms older Safari needs.
    target: ["es2020", "safari16"],
    cssTarget: ["safari16"],
  },
  plugins: [
    react(),
    VitePWA({
      // An installed Home Screen app has no refresh control, so a waiting
      // worker would strand the icon on an old build until a reinstall.
      // autoUpdate activates the new worker (skipWaiting + clientsClaim) as
      // soon as it is fully cached: the running page keeps its session and
      // offers a reload, while every later launch or refresh serves the latest.
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png", "art/*.svg"],
      manifest: {
        id: base,
        name: "Side Quest",
        short_name: "Side Quest",
        description: "The main quest can wait.",
        start_url: base,
        scope: base,
        display: "standalone",
        orientation: "portrait",
        theme_color: "#271c11",
        background_color: "#271c11",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          {
            src: "icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icon-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,webp,avif,woff2}"],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
