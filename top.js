// The top bar. Flat and full width over the hero; once the page scrolls, it
// gathers into one small pill of frosted glass in the middle: mark, links,
// GitHub link, button. Nothing in it changes size or layout, so nothing can
// jump: the pill is a backdrop (.top::before) whose edges travel in from the
// sides, and the mark, links, GitHub link and button slide on transforms measured here. Coming back out is
// the same path in reverse. Runs right after the bar, before the first paint.

{
  const top = document.querySelector('.top')
  const mark = top.querySelector('.brand__mark')
  const name = top.querySelector('.brand__name')
  const nav = top.querySelector('.top__nav')
  const github = top.querySelector('.top__github')
  const button = top.querySelector('.top__end .button')
  const GAP = 6 // px between the mark, the links and the GitHub link inside the pill
  const PAD = [14, 5] // px from the pill's left and right edges to what is inside

  // Offsets ignore transforms, so this always reads the flat layout.
  function measure() {
    const first = mark.offsetWidth ? mark : name // without a mark, the name stays and leads
    const lead = first.offsetWidth
    const pair = button.offsetLeft - github.offsetLeft // the GitHub link and the button keep the gap they have in the flat bar
    const inner = lead + GAP + nav.offsetWidth + GAP + pair + button.offsetWidth
    const left = (top.clientWidth - inner) / 2
    const mid = button.offsetTop + button.offsetHeight / 2
    const half = button.offsetHeight / 2 + PAD[1]
    const set = (key, value) => top.style.setProperty(key, `${Math.round(value)}px`)
    set('--brand-x', left - first.offsetLeft)
    set('--nav-x', left + lead + GAP - nav.offsetLeft)
    set('--github-x', left + lead + GAP + nav.offsetWidth + GAP - github.offsetLeft)
    set('--button-x', left + lead + GAP + nav.offsetWidth + GAP + pair - button.offsetLeft)
    set('--pill-l', left - PAD[0])
    set('--pill-r', top.clientWidth - (left + inner) - PAD[1])
    set('--pill-t', mid - half)
    set('--pill-h', half * 2)
    top.classList.toggle('has-mark', !!mark.offsetWidth)
  }

  const stick = () => top.classList.toggle('is-stuck', scrollY > 8)
  measure()
  stick()
  addEventListener('scroll', stick, { passive: true })
  addEventListener('resize', measure)
  document.fonts?.ready.then(measure)
  document.addEventListener('DOMContentLoaded', measure)
}
