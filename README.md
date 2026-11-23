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

Hosting via GitHub Pages is planned but not enabled. All asset paths are relative, so the page also
works under a subpath such as `/tamari-page/`. Before launch, check `brand.js`: the contact link is a
placeholder (`hello@example.com`).
