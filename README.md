# Tamari landing page

The landing page for Tamari: plain HTML, CSS and a few small scripts, with self-hosted OFL fonts.
No build step. The page makes one request to anyone else: the star count on the GitHub links (see
below). The name, tagline, mark, colours, contact link and GitHub repo live in `brand.js`.

Moved here from `westsoever/miso-miso` (`site/`) with its history.

## Preview

Open `index.html` in a browser, or serve the folder:

```sh
python3 -m http.server 4173
```

then open http://localhost:4173.

## Hosting

Live at https://tamari-studio.github.io/page/ (GitHub Pages, from `main`, root folder). Every
push to `main` publishes. All asset paths are relative, so the page works under that subpath.
Browsers keep each file for up to 10 minutes, so every stylesheet and script in `index.html`
carries `?v=`; change that value (the same everywhere) with each release, or a visitor can get a new
script next to an old stylesheet.
The contact buttons open `info@sunseekerlabs.dk` (`contactUrl` in `brand.js`).

## The GitHub link and its star count

The top bar and the footer link to the repo in `BRAND.githubRepo` (`brand.js`; the links in
`index.html` carry the same address, so they work without JavaScript). `stars.js` adds a live star
count: the visitor's browser asks `api.github.com` once, without cookies or a referrer, and keeps the
answer in `localStorage` for an hour. If the request fails, or the repo is private or missing, no
count shows and the link reads as a plain link. This request sends the visitor's IP address to
GitHub, which is why the page no longer says it makes no third-party requests. The repo is a
placeholder until the owner names the public one: change `githubRepo`, and the `href` and text of
the three GitHub links in `index.html`, together.

## llms.txt

`llms.txt` tells coding agents what Tamari is and how to set it up with `tamari init` (the CLI is
still named `miso` today; the rename follows). The footer links to it. Keep it in step with the CLI.
