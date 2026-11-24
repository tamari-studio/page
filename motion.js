// The scroll's part of the motion. index.html is the finished page and stays so
// without JavaScript and with reduced motion; this script only adds:
//   1. Reveal: below the hero, headings and text rise in once as they arrive.
//   2. Pin: on wide screens the three steps hold still for a while as the page
//      scrolls past. The scenes play on their own clock once the stage has
//      settled, one after the other, not tied to the scroll; scrolled away and
//      back, they play again (reset while out of sight). Nothing in the stage
//      moves with the scroll, so it stays calm.
//   4. Drift: the page's ground leans toward the glass colour from one section
//      to the next (data-drift on each section, 0 to 1). glass.js reads --drift
//      too, so the shader's ground matches the page.
// The glass parting and meeting again (3) is in glass.js.

{
  const root = document.documentElement
  const still = matchMedia('(prefers-reduced-motion: reduce)')
  const clamp = (v) => Math.min(1, Math.max(0, v))
  const smooth = (t) => t * t * (3 - 2 * t)

  if (!still.matches) {
    // 1. Reveal. Counted within each section, so a section's parts arrive in turn.
    const reveal = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        entry.target.classList.add('is-in')
        reveal.unobserve(entry.target)
      }
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' })
    // Not the steps: their stage is pinned, and anything rising in there reads as jitter.
    const parts = '.one h2, .one__text, .yours h2, .yours .pair > div, .price h2, .price__lede, .price__plate, .price__ai, .start h2, .start__for, .start .tier, .close h2, .close .button'
    const count = new Map()
    for (const el of document.querySelectorAll(parts)) {
      const section = el.closest('section')
      const i = count.get(section) || 0
      count.set(section, i + 1)
      el.style.setProperty('--i', Math.min(i, 4))
      el.dataset.reveal = ''
      reveal.observe(el)
    }

    // 2. Pin.
    const path = document.querySelector('.path')
    const pin = path.querySelector('.path__pin')
    const stage = path.querySelector('.path__stage')
    const scenes = [...path.querySelectorAll('.scene')]
    let pinned = false
    let played = false
    let travel = 0
    let top = 0

    function layout() {
      const was = pinned
      path.classList.add('is-pinned') // measured as it will be laid out pinned
      const h = stage.offsetHeight
      top = Math.max(88, (innerHeight - h) / 2) // below the floating top bar
      pinned = innerWidth > 900 && top + h <= innerHeight - 16
      if (!pinned) {
        path.classList.remove('is-pinned')
        pin.style.height = ''
        // Unpinned, demo.js plays the scenes as they come into view. Only when the
        // page was pinned a moment ago (a resize) are the waiting ones let go here,
        // as demo.js passed them over while they were pinned.
        if (was) for (const scene of scenes) delete scene.dataset.wait
        return
      }
      travel = Math.round(innerHeight * 1.2)
      stage.style.top = `${top}px`
      pin.style.height = `${h + travel}px`
    }

    function pinUpdate() {
      if (!pinned) return
      const box = pin.getBoundingClientRect()
      const settled = box.top <= top + 1 && box.bottom >= top + stage.offsetHeight - 1
      const away = box.bottom < 0 || box.top > innerHeight
      if (settled && !played) {
        played = true
        for (const scene of scenes) delete scene.dataset.wait // they take turns through --d
      } else if (away && played) {
        played = false
        for (const scene of scenes) scene.dataset.wait = ''
      }
    }

    // 4. Drift. The line the page is read at runs from the top of the screen
    // (at the very top) through the middle to the bottom (at the very end), so
    // the first and last sections reach their own value.
    const grounds = [...document.querySelectorAll('[data-drift]')].map((el) => ({ el, d: parseFloat(el.dataset.drift) || 0 }))
    function drift() {
      const vh = innerHeight
      const left = root.scrollHeight - vh - scrollY
      const line = vh / 2 - (1 - clamp(scrollY / vh)) * (vh / 2) + (1 - clamp(left / vh)) * (vh / 2)
      const at = grounds.map(({ el, d }) => {
        const box = el.getBoundingClientRect()
        return { y: box.top + box.height / 2, d }
      })
      let d = at[0].d
      if (line >= at[at.length - 1].y) d = at[at.length - 1].d
      else {
        for (let k = 0; k < at.length - 1; k++) {
          if (line >= at[k].y && line < at[k + 1].y) {
            d = at[k].d + (at[k + 1].d - at[k].d) * smooth((line - at[k].y) / (at[k + 1].y - at[k].y))
            break
          }
        }
      }
      // Only real changes: each one repaints everything drawn in the page colour.
      if (Math.abs(d - lastDrift) < 0.01 && d !== at[0].d && d !== at[at.length - 1].d) return
      lastDrift = d
      root.style.setProperty('--drift', d.toFixed(2))
    }
    let lastDrift = -1

    let pending = 0
    const update = () => {
      pending = 0
      pinUpdate()
      drift()
    }
    const soon = () => (pending ||= requestAnimationFrame(update))
    addEventListener('scroll', soon, { passive: true })
    addEventListener('resize', () => {
      layout()
      soon()
    })
    document.fonts?.ready.then(() => {
      layout()
      soon()
    })
    layout()
    update()
  }
}
