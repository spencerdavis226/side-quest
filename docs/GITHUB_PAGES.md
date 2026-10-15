# GitHub Pages release

Repository: `spencerdavis226/side-quest` (named `Drink-at-Ron` until 2026-10-05; GitHub redirects the old repository URL, but not the old Pages URL).
Live URL: https://spencerdavis226.github.io/side-quest/
Published via **GitHub Actions** on 2026-09-25 (merge commit `7dad3ee`, workflow run `36210874943`). The repository's Pages source is "GitHub Actions". A fresh browser confirmed that release ID, the three packs, a controlling service worker, and an offline reload. Later documentation commits can advance the live release ID without changing the game; verify the live ID before naming a specific build as deployed.

In repository Settings → Pages, select GitHub Actions as the build source. The workflow checks pull requests and main. Only main can publish, and only after all checks succeed. No backend, environment secrets, remote fonts, or paid services are needed. Enable required status checks for the build job in repository branch protection if desired.

## Local release checks

Use Node 22.12 or later:

```sh
npm ci
npx playwright install chromium webkit
npm test
BASE_PATH=/side-quest/ npm run build
BASE_PATH=/side-quest/ CI=1 TEST_PORT=4398 npm run test:release
BASE_PATH=/side-quest/ npm run test:update
```

`TEST_PORT=4183` can select an unused production-test port. CI never attaches to an existing server. Local development uses `/`; production uses `/side-quest/`. All public screens remain at that base URL. The workflow derives the base path from the repository name, so a rename needs no workflow change (local commands in the docs still name `/side-quest/`). A custom domain serves from `/`, so it needs `BASE_PATH: /` and a retest of manifest scope and installation identity.

The normal PR/main workflow uses the tagged Chromium/WebKit release smoke suite, unit tests, Pages build/budgets, and two-build update check. To run the full production browser suite and every-card workshop sweeps, manually dispatch the same workflow with `full_validation` enabled. Those longer checks are for layout/engine work and dedicated card review, not routine publication. A passing smoke suite is a scoped release gate; report any known full-suite failure separately.

The deployment uploads the exact `dist` artifact tested by browser checks. The two-build update test builds its second release in a temporary directory and never modifies that artifact. `VITE_RELEASE_ID` uses the commit SHA in CI and is exposed only as an HTML data attribute for diagnostics.

Build budgets (`scripts/check-budget.ts`): at most 4 MiB total runtime files (a conservative precache upper bound; raised from 3 MiB on 2026-10-15), 500 KiB per image, and at most 200 KiB gzip lazy feature JavaScript. Initial (entry) JavaScript is reported but uncapped since 2026-10-05, and card text must stay out of it. The build rejects workshop code in shipped JavaScript. Workshop assets live outside public and are not shipped. Future illustrated packs require reviewing these budgets and caching strategy deliberately.

The service worker caches local fonts and artwork. Updates remain pending during gameplay and are offered between games. Saved sessions and preferences are retained. GitHub Pages cannot supply custom cache headers; rely on Vite's hashed bundles and the service-worker release lifecycle.

After first publishing, verify the live URL on physical iPhone/iPad using DEVICE_CHECKLIST.md. Local tests do not prove live repository configuration or installed iOS behavior.
