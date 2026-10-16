# public — shipped static files

Everything here is copied into `dist` and precached by the service worker (`vite.config.ts`: glob of js/css/html/svg/png/webp/avif/woff2). Keep it small: runtime total ≤ 4 MiB, any image ≤ 500 KiB (the card back is already near it).

- Icons: `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable.png` are the Home Screen identity. Changing them changes what installed users see only after a reinstall on iOS.
- `art/`: table, card back, button/panel/bezel chrome, tankard, `packs/*.svg` (one single-colour silhouette per pack or mode; the app tints it), and `crawl/*.svg` (Pub Crawl's hearts, items, curses and boss marks). The game-icons silhouettes are written by `scripts/crawl-icons.ts` (CC BY 3.0, `docs/licenses`). Sources live in `assets/source`; regenerate with the matching script rather than hand-editing a `.webp`.
- `fonts/`: local Grenze and Source Serif 4 only. No remote fonts, CDN, or runtime services; the app must work offline and on GitHub Pages under a sub-path, so reference files through `asset()` or CSS `url()` rather than hard-coded absolute paths in TypeScript.
- Do not put dev-only or workshop assets here.
