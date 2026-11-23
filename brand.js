// Everything brand-dependent lives in this file: name, tagline, mark, colours and
// the contact link. A rename is a change here and nowhere else; no other file
// contains the name.
// Preview: `python3 -m http.server 4173 --directory site`, then http://localhost:4173
// shortcut: the name and title are filled in by this script, so link previews and
// crawlers that run no JavaScript see no name. Render it at build time before launch.

const BRAND = {
  name: 'Tamari', // chosen 2026-11-23; written with a capital T, also as the wordmark
  tagline: 'Where your team’s software lives.',

  // Placeholder. Put the real address here; nothing else needs to change. Each
  // button adds its own subject (data-subject in index.html).
  contactUrl: 'mailto:hello@example.com',

  // The two typefaces: one for headlines, one for text. All are free web fonts
  // under the SIL Open Font License, self-hosted in site/fonts/ with their
  // licence texts; styles.css loads the files under the family names used here.
  // To change a face, replace its file and tune its numbers below.
  //
  // Headlines: Zen Kaku Gothic New, Light. Text: M PLUS 1 (variable weight).
  // To swap the two roles, swap the family names here and the preload in index.html.
  // `scale` multiplies every headline size; `tracking` and `leading` are for the largest size.
  type: 'zen',
  display: {
    zen: { family: "'Brand Display', ui-sans-serif, system-ui, sans-serif", file: 'fonts/zen-light.woff2', weight: 300, scale: 0.9, tracking: '-0.03em', leading: 1.08 }, // Zen Kaku Gothic New
  },
  text: "'Brand Text', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif", // M PLUS 1

  // Optional. Three stacked forms, each with one tight corner, as in the art.
  // One solid colour, so it reads at 16px. Set to '' for the wordmark alone.
  mark: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12.2 1.5H18a3 3 0 0 1 0 6h-8a1 1 0 0 1-1-1V4.7a3.2 3.2 0 0 1 3.2-3.2z"/>
    <path d="M6 9h10a1 1 0 0 1 1 1v1.8a3.2 3.2 0 0 1-3.2 3.2H6a3 3 0 0 1 0-6z"/>
    <path d="M10 16.5h8.8a3.2 3.2 0 0 1 3.2 3.2v1.8a1 1 0 0 1-1 1H10a3 3 0 0 1 0-6z"/>
  </svg>`,

  colors: {
    ground: '#f5f6fb', // cool near-white, the page
    paper: '#ffffff',
    ink: '#0f1220',
    soft: '#404660', // secondary text; passes AA even on `sky`, the darkest the art gets
    line: '#dde1ed', // hairlines
    mist: '#dfe6fb', // the pale end of the glass forms
    sky: '#a8b8f0', // periwinkle; the darkest colour in the quiet glass below the hero
    core: '#7f97ea', // the saturated heart of the hero glass; no text sits on it
    deep: '#3a489c', // periwinkle dark enough for small text
  },

  // The one prismatic accent: the seam where two glass forms meet, in the hero
  // and once more in the closing section.
  prism: ['#e5484d', '#f2c230', '#4f7df0', '#8b5cf6'],
}

{
  const root = document.documentElement
  for (const [key, value] of Object.entries(BRAND.colors)) root.style.setProperty(`--${key}`, value)
  BRAND.prism.forEach((value, i) => root.style.setProperty(`--prism-${i + 1}`, value))
  const pick = new URLSearchParams(location.search).get('type')
  const display = BRAND.display[pick] || BRAND.display[BRAND.type]
  root.style.setProperty('--font-display', display.family)
  root.style.setProperty('--display-weight', display.weight)
  root.style.setProperty('--display-scale', display.scale)
  root.style.setProperty('--display-tracking', display.tracking)
  root.style.setProperty('--display-leading', display.leading)
  root.style.setProperty('--font-text', BRAND.text)
  document.title = `${BRAND.name}: ${BRAND.tagline}`
  // index.html preloads the default headline face; a face picked with ?type is preloaded here.
  if (!document.querySelector(`link[rel="preload"][href="${display.file}"]`)) document.head.insertAdjacentHTML('beforeend', `<link rel="preload" href="${display.file}" as="font" type="font/woff2" crossorigin>`)

  const fill = {
    name: (el) => (el.textContent = BRAND.name),
    tagline: (el) => (el.textContent = BRAND.tagline),
    mark: (el) => (el.innerHTML = BRAND.mark),
    icon: (el) => BRAND.mark && (el.href = `data:image/svg+xml,${encodeURIComponent(BRAND.mark.replace('currentColor', BRAND.colors.ink))}`),
    contact: (el) => (el.href = `${BRAND.contactUrl}?subject=${encodeURIComponent(el.dataset.subject || 'Waitlist')}`),
    description: (el) => (el.content = `${BRAND.name}. ${BRAND.tagline}`),
  }
  // Fill each element as the parser adds it, so the name and headline are in
  // place before the first paint and nothing shifts.
  const done = new WeakSet()
  const apply = () => {
    for (const el of document.querySelectorAll('[data-brand]')) {
      if (done.has(el)) continue
      done.add(el)
      fill[el.dataset.brand]?.(el)
    }
  }
  const watcher = new MutationObserver(apply)
  watcher.observe(root, { childList: true, subtree: true })
  document.addEventListener('DOMContentLoaded', () => {
    apply()
    watcher.disconnect()
  })
}
