# Tamari landing page

The landing page for Tamari: plain HTML, CSS and a few small scripts, with self-hosted OFL fonts.
No build step and no third-party requests. The name, tagline, mark, colours and contact link live in
`brand.js`.

Moved here from `westsoever/miso-miso` (`site/`) with its history.

## Preview

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 4173
```

then open http://localhost:4173.

## Hosting

Live at https://westsoever.github.io/tamari-page/ (GitHub Pages, from `main`, root folder). Every
push to `main` publishes. All asset paths are relative, so the page works under that subpath.
Browsers keep each file for up to 10 minutes, so every stylesheet and script in `index.html`
carries `?v=`; change that value (the same everywhere) with each release, or a visitor can get a new
script next to an old stylesheet.
The contact buttons open `info@sunseekerlabs.dk` (`contactUrl` in `brand.js`).

## llms.txt

`llms.txt` tells coding agents what Tamari is and how to set it up with `tamari init` (the CLI is
still named `miso` today; the rename follows). The footer links to it. Keep it in step with the CLI.
