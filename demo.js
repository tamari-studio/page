// Plays the illustrations. index.html holds each one's finished frame, which is
// what shows without JavaScript and with reduced motion. This script only adds
// time: the hero loops calmly while it is on screen, and each of the three
// scenes plays once when it scrolls into view, then rests.

{
  const demo = document.querySelector('.demo')
  const art = document.querySelector('.art')
  const typed = demo.querySelector('[data-type]')
  const sentence = typed.textContent
  const track = demo.querySelector('.stages__track')
  const chosen = demo.querySelector('.stages__on')
  const still = matchMedia('(prefers-reduced-motion: reduce)')

  const set = (state) => {
    for (const [key, value] of Object.entries(state)) {
      if (value === false) delete demo.dataset[key]
      else demo.dataset[key] = value === true ? '' : value
    }
    placePill()
  }

  // The highlight is measured from the label it sits on, never hard-coded.
  function placePill() {
    const on = demo.querySelector(`[data-pick="${demo.dataset.stage === 'everyone' ? 'all' : 'some'}"]`)
    chosen.style.clipPath = `inset(0 ${track.offsetWidth - on.offsetLeft - on.offsetWidth}px 0 ${on.offsetLeft}px round 13px)`
  }

  let running = false
  let beat = 0
  let timer = 0
  let typing = 0

  function type() {
    clearInterval(typing)
    typing = setInterval(() => {
      if (!running) return
      typed.textContent = sentence.slice(0, typed.textContent.length + 1)
      if (typed.textContent === sentence) clearInterval(typing)
    }, 42)
  }

  // Leaves as one thing, then returns to the first frame while nothing shows.
  function reset() {
    demo.dataset.snap = ''
    typed.textContent = ''
    set({ ask: false, typing: false, done: false, card: false, stage: 'draft' })
    void demo.offsetWidth
    delete demo.dataset.snap
    delete demo.dataset.out
  }

  // [wait before it in ms, what happens]. One thing starts at a time.
  const beats = [
    [1100, () => set({ ask: true, typing: true })],
    [500, type],
    [sentence.length * 42 + 800, () => set({ typing: false, done: true })],
    [900, () => set({ card: true })],
    [3300, () => set({ stage: 'team' })],
    [2600, () => set({ stage: 'everyone' })],
    [2800, () => set({ out: true })],
    [1000, reset],
  ]

  function next() {
    timer = setTimeout(() => {
      beats[beat][1]()
      beat = (beat + 1) % beats.length
      next()
    }, beats[beat][0])
  }

  let seen = false
  function sync() {
    const run = seen && !document.hidden && !still.matches
    art.classList.toggle('is-paused', !run)
    if (run === running) return
    running = run
    clearTimeout(timer)
    if (running) next()
  }

  addEventListener('resize', placePill)
  document.fonts?.ready.then(placePill)
  placePill()

  if (!still.matches) {
    // Start from the first frame, with the poster's additions taken away unseen.
    demo.dataset.out = ''
    reset()
    demo.dataset.live = ''
    new IntersectionObserver(([entry]) => {
      seen = entry.isIntersecting
      sync()
    }, { threshold: 0.3 }).observe(demo)
    document.addEventListener('visibilitychange', sync)

    // The scenes wait on their first frame and play once, when mostly in view.
    const once = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        delete entry.target.dataset.wait
        once.unobserve(entry.target)
      }
    }, { threshold: 0.6 })
    for (const scene of document.querySelectorAll('.scene')) {
      scene.dataset.wait = ''
      once.observe(scene)
    }
  }
  still.addEventListener('change', () => location.reload())
}
