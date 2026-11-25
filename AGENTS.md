# Agent notes for tamari-studio/page

The Tamari landing page: plain HTML, CSS and a few scripts, no build step. The one request to anyone
else is the GitHub star count (`stars.js`); it hides itself when it fails. Add no other.
See README.md for what lives where.

## Every push to main publishes

GitHub Pages serves `main` at https://tamari-studio.github.io/page/. A push to `main` is a
release, so work on a branch and merge only when the owner says so. After pushing, check that the
Pages build finished (`gh api repos/tamari-studio/page/pages/builds/latest`).

## Change `?v=` with every release

Browsers keep each file for up to 10 minutes. Without a new version tag, a visitor can run a new
script against an old stylesheet, and the page breaks in ways that are hard to see (the top bar
snapped instead of sliding).

- Every stylesheet and script in `index.html` loads with `?v=<value>`, the same value everywhere.
- When a release changes any CSS or JS file, set a new value in the same commit:
  `sed -i '' 's/?v=[0-9][0-9-]*/?v=NEW/g' index.html` (use the date plus a counter, e.g. `20261125-1`).
- A new stylesheet or script gets the tag too.

## Motion rules

- `index.html` is the finished page. Scripts only add motion, so the page must read fully without
  JavaScript and with `prefers-reduced-motion: reduce`. Test both after a change.
- Only animate `transform` and `opacity` where you can. Check scroll smoothness in a real browser.
