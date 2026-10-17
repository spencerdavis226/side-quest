# src/presentation/dice — dice renderer adapter

The only renderer is `@3d-dice/dice-box-threejs`, lazy-loaded through `library.ts` (`createDiceStage`) and used by `src/components/FullScreenDice.tsx`. Do not add a second renderer or a CDN asset.

- Outcomes come from `src/game/dice.ts` and are committed before the throw. The adapter records the library's own pre-simulation, replays it as a bounded 1.5–2.6 s trajectory (`trajectory.ts`), and checks that the final upward faces equal the saved values.
- Never change per-body damping or sleep between the pre-simulation and the replay: the forced face diverges.
- `skin.ts` paints the face textures on a canvas. Centre numerals by measured ink box with an alphabetic baseline, not `textBaseline: "middle"` (WebKit resolves that about 0.08em higher than Chromium). `tests/workshop/dice-texture.spec.ts` guards this in both engines.
- `palette.ts` (2026-10-17): `diceColors(palette)` derives every colour the skin paints from a starter's or omen's `{ primary, secondary }`; `houseDice` is the original brass and teal, used when there is no palette. `createDiceStage(selector, palette)` names one library colorset per palette so its material cache never mixes them.
- `result-text.ts` builds the resolved sentence shown on the card; legacy prose snapshots still resolve.
- `dispose()` must release the WebGL context (`forceContextLoss`) and remove the canvas. iOS limits live contexts, so leaks show up as a blank stage after many rolls. A lost context falls back to the saved result with no replay.
- The renderer never allocates for restored results, hidden tabs, or Reduced Motion; those reveal the saved outcome directly.
- Check bundle impact: this stays in the lazy tier (`scripts/check-budget.ts`: 200 KiB gzip lazy, 100 KiB initial).
