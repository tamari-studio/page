// The star count on the GitHub links (the top bar and the footer, marked data-github).
//
// The links work without this script: they are plain links in index.html, and the count in them is
// `hidden` until there is a number. This is the one request the page makes to anyone but itself:
// the visitor's browser asks api.github.com for the repo's star count (BRAND.githubRepo in
// brand.js), sends no cookies and no referrer, and keeps the answer in localStorage for an hour,
// so a visitor asks at most once an hour. When the request fails (offline, rate limited, a repo
// that is private or missing), no count shows, and that is remembered for the hour too.
//
// The top bar measures its links, so the bar measures again when the count changes its width
// (top.js watches the link).

{
  const KEY = 'tamari:stars'
  const HOUR = 60 * 60 * 1000
  const repo = BRAND.githubRepo
  const links = [...document.querySelectorAll('[data-github]')]

  const read = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY))
      const fresh = saved && saved.repo === repo && Number.isFinite(saved.at) && Date.now() - saved.at < HOUR && Date.now() >= saved.at
      return fresh ? { count: Number.isInteger(saved.count) && saved.count >= 0 ? saved.count : null } : null
    } catch {
      return null // storage blocked, or not JSON: ask again
    }
  }
  const write = (count) => {
    try {
      localStorage.setItem(KEY, JSON.stringify({ repo, count, at: Date.now() }))
    } catch {} // storage full or blocked: the count still shows, it is just asked for again next time
  }

  const show = (count) => {
    if (count === null) return
    const short = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(count)
    for (const link of links) {
      const stars = link.querySelector('[data-stars]')
      if (!stars) continue
      stars.querySelector('[data-stars-count]').textContent = short
      stars.hidden = false
      link.setAttribute('aria-label', `Tamari on GitHub, ${count.toLocaleString('en')} ${count === 1 ? 'star' : 'stars'} (opens in a new tab)`)
    }
  }

  const saved = read()
  if (saved) show(saved.count)
  else if (links.length && /^[\w.-]+\/[\w.-]+$/.test(repo)) {
    fetch(`https://api.github.com/repos/${repo}`, {
      headers: { Accept: 'application/vnd.github+json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: AbortSignal.timeout(5000),
    })
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error(String(response.status)))))
      .then((data) => {
        const count = Number.isInteger(data?.stargazers_count) && data.stargazers_count >= 0 ? data.stargazers_count : null
        write(count)
        show(count)
      })
      .catch(() => write(null))
  }
}
