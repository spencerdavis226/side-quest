# src/presentation — look, motion, and the card state machine

- `controller.ts`: `PresentationController` is the only thing that advances a game from a tap. It persists first, then animates; animation completion never advances the deck. `finish(id)` ignores stale transition ids. Taps are ignored during motion except the dice "finish" tap.
- `usePresentation.ts`: timers and Reduced Motion/hidden-tab handling; backgrounding or Reduced Motion settles any motion immediately.
- `theme.ts`: motion durations and asset paths. They become `--motion-*` CSS variables in `main.tsx`; keep names in sync with the CSS fallbacks.
- `theme.css`, `card-front.css`, `../style.css`: the three main stylesheets (`crawl.css` adds Pub Crawl's furniture). `style.css` owns layout, safe areas, and the table backdrop; `theme.css` owns dialogs, atmosphere (fire, embers, dust, candle), and button chrome; `card-front.css` owns card text fitting.
- `frame-surfaces.ts`: the only list of bundled frame images (`coreFrameSurfaces`, and `leagueSurfaces`, the Ancient Mew front and back every card of a Pokémon League game uses via `.league-deck` on `main`). Do not add an eager glob of `art/`.
- `artwork.ts`, `imprint.ts`, `imprint/`: legacy artwork resolver and the generated icon sprite (`npm run imprint`). Keep both for saved-content compatibility; card fronts do not render illustrations.
- `dice/`: see its own CLAUDE.md.

## iOS constraints that bite here

- Size layout with `var(--app-height)` and the backdrop with `var(--backdrop-height)` (`style.css`), not raw `svh`/`dvh`, plus `env(safe-area-inset-*)`; `--top-safe` exists so tests can pose an inset. In the installed iOS app WebKit lays the page out one top inset short of the screen and only `lvh` reports the real height, so `html.standalone` makes the document exactly `100lvh`, stops the root scrolling (tall content scrolls inside `#root`), and `main.tsx` holds `scrollY` at 0. Remove any of those three and a flat strip returns at the bottom or behind the status bar. Measured in the iOS 18.5 and 27.0 simulators; see STATUS.md. Keep controls below the top inset.
- WebKit can paint the back of a clipped 3D face; `Play.tsx` culls front/back by the rendered angle. Do not remove that when touching the flip.
- The approved 2:3 frame ratio, stationary-tap activation, and scrollable long rules must all keep working. A pointer that moves more than 8px or scrolls the rules must not activate the card.
- Looping ambient animations run for the whole session. Anything new that animates continuously must pause when `document.hidden` and respect `prefers-reduced-motion`.
