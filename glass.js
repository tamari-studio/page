// Draws the glass. One small fragment shader, no library: three forms that fold
// into each other, each bending the light field and the forms behind it.
// index.html holds a <canvas class="lens"> wherever the glass shows; the CSS
// glass next to it is what paints first and what stays when the shader cannot
// run: no WebGL, no OffscreenCanvas in workers, a software renderer, or a lost
// context. ?glass=css keeps the CSS glass; ?glass=shader skips the
// software-renderer check.
//
// This file runs twice. On the page it measures and keeps time. As a worker
// (it starts itself as one) it owns the WebGL context and paints, so compiling
// the shader and drawing a frame never hold up the page.
//
// Cost: one WebGL context for the whole page, off the main thread; frames only
// for canvases on screen, about ten a second (the drift is under a tenth of a
// pixel a frame, so more would look the same), up to thirty only while the
// scroll moves the forms apart or together; device pixel ratio capped; and
// nothing at all while the tab is hidden or no canvas is on screen. Reduced
// motion: one still frame.

if (typeof document === 'undefined') {
  const VERT = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}'
  const FRAG = `
precision highp float;
uniform vec2 u_size;    // canvas, CSS px
uniform float u_px;     // device px per CSS px
uniform vec4 u_view;    // where the art's origin sits (CSS px), its scale, and 1 or -1 to mirror it
uniform vec4 u_look;    // seam strength, 1 = hero field / 0 = floating on the page, tilt (radians), depth of colour
uniform float u_time;
uniform float u_part;   // 0 = the forms rest in the fold, 1 = drawn apart (the scroll, see below)
uniform vec3 c_ground, c_mist, c_sky, c_core, c_deep;
uniform vec3 u_prism[6];

// A box with four corner radii: bottom right, top right, bottom left, top left (y points down).
float box(vec2 p, vec2 b, vec4 r) {
  r.xy = p.x > 0. ? r.xy : r.zw;
  r.x = p.y > 0. ? r.x : r.y;
  vec2 q = abs(p) - b + r.x;
  return min(max(q.x, q.y), 0.) + length(max(q, 0.)) - r.x;
}
vec2 turn(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x + s * p.y, c * p.y - s * p.x); }

// The three forms, in art units (CSS px at scale 1). A hangs from above, B is
// the body with the saturated shoulder, C leans across B from below. Each
// drifts a few px on its own slow clock, and the scroll draws the three apart
// (A up and out, B down and in, C down and out), so the seam goes out as they part.
vec2 sway(float k) { return vec2(sin(u_time * .11 + k * 2.1), cos(u_time * .083 + k * 1.3)) * 5.; }
float formA(vec2 p) { p -= sway(1.) + u_part * vec2(-60., -110.); return box(p - vec2(-140., -420.), vec2(470., 380.), vec4(96., 96., 96., 96.)); }
float formB(vec2 p) { p -= sway(2.) + u_part * vec2(50., 70.); return box(p - vec2(84., 420.), vec2(250., 452.), vec4(60., 96., 60., 150.)); }
float smax(float a, float b, float k) { float h = max(k - abs(a - b), 0.) / k; return max(a, b) + h * h * k * .25; }
float formC(vec2 p) {
  p -= sway(3.) + u_part * vec2(-110., 90.);
  float top = dot(p - vec2(-60., 470.), vec2(.60, -.80)); // the long edge, falling to the right
  return smax(smax(-210. - p.x, top, 190.), p.x - 430., 260.);
}

float e;        // half a device pixel, in art units
vec2 light;     // points at the lit side (down and right)
vec2 at;        // where we are looking, bent by each form on the way down
vec3 mul, add;  // what is behind comes out as behind * mul + add
float shade;    // how much the forms above darken the next one

float line(float d, float w) { float x = d / (w + e); return exp(-x * x); }

// One form: d is its distance field at 'at', n the outward normal, pres how
// present it is here (forms dissolve into the light where they leave the fold),
// and depth how near its dark shoulder we are (smooth, so no crease shows
// where the normal turns over inside the form).
void form(float d, vec2 n, float pres, float body, float depth) {
  float cov = pres * smoothstep(e, -e, d);
  float inside = max(-d, 0.);
  float lit = dot(n, light);
  float dark = smoothstep(-.15, .9, -lit); // edges that face away from the light
  float bright = smoothstep(-.1, .95, lit);

  // The fold: a form lying under another is deepest where they meet.
  mul *= mix(vec3(1.), mix(c_core, c_deep, .28), shade * cov * u_look.w);
  // Thickness: saturated just inside a dark edge, draining away inward.
  float band = .5 * dark * exp(-inside / 30.) + .78 * depth;
  vec3 tint = mix(vec3(1.), mix(c_core, c_sky, .25), body * cov * band * u_look.w);
  // A veil of white further in, so the far side of a form goes to light.
  float veil = cov * (mix(.3, .08, body) + .42 * (1. - exp(-inside / 240.)) + (1. - body) * .45 * exp(-inside / 40.)) * (1. - .6 * min(band, 1.));

  // Rims. The outer one is hair-thin in the dark and flares toward the light;
  // the inner one (the far wall of the glass) drifts away from it and back.
  float w1 = mix(.45, 1.5, bright);
  float gap = 5. + 13. * (.5 + .5 * sin(atan(n.y, n.x) * 2. + 1.1)) * (.35 + .65 * bright);
  float rim = (.3 + .7 * bright) * line(d, w1)
            + (.1 + .5 * bright) * line(d + gap, w1 * .8) * step(d, 0.)
            + .28 * bright * bright * exp(-abs(d) / 4.)
            + .22 * dark * exp(-abs(d + 1.5) / 2.2) * step(d, 0.);
  rim *= pres;

  add += mul * (veil + rim * (1. - veil));
  mul *= tint * (1. - veil) * (1. - rim);
  // What this form does to the one below it, just outside its edge.
  shade = max(shade * (1. - cov), pres * step(0., d) * exp(-d / 46.) * (.35 + .65 * bright));
  // Refraction: a steep bend at the bevel, a shallow one across the body.
  at -= n * cov * (26. * exp(-inside / 14.) + 20. * exp(-inside / 42.) * (1. - exp(-inside / 24.)));
}

vec3 prism(float t) {
  t = clamp(t, 0., 1.) * 5.;
  vec3 c = u_prism[0];
  c = mix(c, u_prism[1], clamp(t, 0., 1.));
  c = mix(c, u_prism[2], clamp(t - 1., 0., 1.));
  c = mix(c, u_prism[3], clamp(t - 2., 0., 1.));
  c = mix(c, u_prism[4], clamp(t - 3., 0., 1.));
  c = mix(c, u_prism[5], clamp(t - 4., 0., 1.));
  return c;
}

// The light behind the glass. In the hero it fills the canvas: periwinkle from
// the upper right, draining to the page colour lower left and at the foot.
vec3 field(vec2 p, vec2 q) {
  if (u_look.y > .5) {
    vec2 uv = p / u_size;
    float t = smoothstep(.1, 1.15, .62 * uv.x + .52 * (1. - uv.y));
    vec3 c = mix(mix(c_ground, c_mist, smoothstep(0., .5, t)), mix(c_sky, c_mist, .3), smoothstep(.45, 1., t));
    c = mix(c, c_sky, .5 * exp(-dot(q - vec2(140., 60.), q - vec2(140., 60.)) / 2.2e5));
    return mix(c, c_ground, smoothstep(.62, .98, uv.y));
  }
  float haze = exp(-dot(q - vec2(60., 140.), q - vec2(60., 140.)) / 7e4);
  return mix(c_ground, mix(c_sky, c_mist, .5), .55 * haze * u_look.w);
}

#define NORMAL(f, p) normalize(vec2(f(p + vec2(1., 0.)) - f(p - vec2(1., 0.)), f(p + vec2(0., 1.)) - f(p - vec2(0., 1.))) + 1e-5)

void main() {
  vec2 p = vec2(gl_FragCoord.x, u_size.y * u_px - gl_FragCoord.y) / u_px;
  vec2 q = turn((p - u_view.xy) / u_view.z * vec2(u_view.w, 1.), u_look.z);
  e = .5 / (u_px * u_view.z);
  float wob = .12 * sin(u_time * .06);
  light = normalize(vec2(.62 + wob, .78 - wob));
  at = q; mul = vec3(1.); add = vec3(0.); shade = 0.;

  // Where each form is present. A dissolves to the left of the fold and B to
  // its right, so no form closes into a tile; all of them leave at the foot of
  // the hero and at the edge of a floating canvas.
  vec2 uv = p / u_size;
  float here = u_look.y > .5 ? smoothstep(.98, .7, uv.y)
    : smoothstep(0., .25, uv.x) * smoothstep(1., .75, uv.x) * smoothstep(0., .25, uv.y) * smoothstep(1., .65, uv.y);
  float presA = here * smoothstep(-270., -40., q.x) * smoothstep(-640., -260., q.y);
  float presC = here;
  float presB = here * (1. - .8 * smoothstep(120., 330., q.x));
  float dA = formA(at); form(dA, NORMAL(formA, at), presA, .5, 0.);
  float dC = formC(at); form(dC, NORMAL(formC, at), presC, .25, exp(-max(dot(at - vec2(-210., 440.), light), 0.) / 200.));
  float dB = formB(at); form(dB, NORMAL(formB, at), presB, 1., exp(-max(dot(at - vec2(-166., -32.), light), 0.) / 310.));

  // Back to canvas px for the field.
  vec2 back = turn(at, -u_look.z) * vec2(u_view.w, 1.) * u_view.z + u_view.xy;
  vec3 c = field(back, at) * mul + add;

  // The seam: where A lies on B's shoulder the gap between them splits the
  // light. A wedge in the gap, thinning to a line along B's edge.
  if (u_look.x > 0.) {
    float a0 = formA(q), b0 = formB(q);
    vec2 f = q - vec2(-70., -6.);
    float along = clamp(.5 + (f.x * .8 - f.y * .6) / 520., 0., 1.);
    float reach = exp(-dot(f, f) / 5.2e4);
    float wedge = smoothstep(-1., 1.5, a0) * smoothstep(-1., 1.5, b0) * exp(-(a0 + b0) / 9.);
    float thread = line(b0 - 1., 1.1) + .35 * exp(-abs(b0) / 9.);
    float k = u_look.x * reach * clamp(wedge + thread * smoothstep(.0, .25, along) * smoothstep(1., .6, along), 0., 1.);
    float across = clamp(a0 / (a0 + b0 + 1e-3), 0., 1.);
    c = mix(c, prism((along - .22) * 1.2 + across * .15), k * .9);
  }

  // Floating canvases fade to nothing at their own edge.
  float alpha = u_look.y > .5 ? 1. : smoothstep(0., .5, here);
  c += (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - .5) / 255.;
  gl_FragColor = vec4(c * alpha, alpha);
}`


  let canvas, gl, at

  function start({ colors, prism, force }) {
    canvas = new OffscreenCanvas(1, 1)
    gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power', failIfMajorPerformanceCaveat: !force })
    if (!gl) return false
    const program = gl.createProgram()
    for (const [type, source] of [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, FRAG]]) {
      const shader = gl.createShader(type)
      gl.shaderSource(shader, source)
      gl.compileShader(shader)
      gl.attachShader(program, shader)
    }
    gl.bindAttribLocation(program, 0, 'a')
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return false
    gl.useProgram(program)
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    gl.enableVertexAttribArray(0)
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0)
    at = {}
    for (const name of ['u_size', 'u_px', 'u_view', 'u_look', 'u_time', 'u_part', 'u_prism', 'c_ground']) at[name] = gl.getUniformLocation(program, name)
    for (const [name, value] of Object.entries(colors)) gl.uniform3fv(gl.getUniformLocation(program, `c_${name}`), value)
    gl.uniform3fv(at.u_prism, prism)
    canvas.addEventListener('webglcontextlost', () => {
      gl = null
      postMessage({ lost: true })
    })
    return true
  }

  onmessage = ({ data }) => {
    if (data.start) return postMessage({ ready: start(data.start) })
    if (!gl) return
    const { id, w, h, px, x, y, scale, mirror, seam, hero, tilt, depth, time, part, ground } = data
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
    }
    gl.viewport(0, 0, w, h)
    gl.uniform2f(at.u_size, w / px, h / px)
    gl.uniform1f(at.u_px, px)
    gl.uniform4f(at.u_view, x, y, scale, mirror)
    gl.uniform4f(at.u_look, seam, hero, tilt, depth)
    gl.uniform1f(at.u_time, time)
    gl.uniform1f(at.u_part, part)
    gl.uniform3fv(at.c_ground, ground)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
    const bitmap = canvas.transferToImageBitmap()
    postMessage({ id, bitmap }, [bitmap])
  }
} else {
  const FPS = 10
  const MAX_DPR = 2
  const MAX_PIXELS = 2.6e6 // per canvas; above this the canvas is drawn smaller and scaled up

  const src = document.currentScript.src
  const root = document.documentElement
  const ask = new URLSearchParams(location.search).get('glass')
  const still = matchMedia('(prefers-reduced-motion: reduce)')
  const lenses = [...document.querySelectorAll('canvas.lens')].map((canvas) => ({ canvas, ctx: null, view: null, seen: false, busy: false, part: 0 }))

  // Where the art sits in each canvas: x and y of its origin in CSS px, its
  // scale, mirror (1 or -1), seam, tilt and depth of colour. The origin is the
  // corner of the fold. The hero hangs it on the window, so the window rests
  // in the fold at any width; lower down the page the same forms come back
  // smaller and paler, each canvas fading out at its own edge.
  const wide = () => innerWidth > 900
  const place = {
    hero(box) {
      const win = document.querySelector('.demo .win').getBoundingClientRect()
      const x = win.left - box.left, y = win.top - box.top
      return wide() ? { x: x + 12, y, scale: 1, seam: 1 } : { x: x + 20 + 166 * 0.7, y: y - 44 + 32 * 0.7, scale: 0.7, seam: 1 }
    },
    one: (box) => (wide() ? { x: box.width * 0.87, y: box.height * 0.25, scale: 0.8, depth: 0.55 } : { x: box.width * 0.36, y: box.height * 0.34, scale: 0.5, depth: 0.55 }),
    yours: (box) => ({ x: box.width * 0.47, y: box.height * 0.24, scale: 0.8, mirror: -1, depth: 0.55 }),
    price: (box) => ({ x: box.width * 0.42, y: box.height * 0.36, scale: 0.75, depth: 0.6 }),
    close: (box) => (wide() ? { x: box.width * 0.36, y: box.height * 0.26, scale: 0.62, seam: 1, depth: 0.85 } : { x: box.width * 0.65, y: box.height * 0.42, scale: 0.5, seam: 1, depth: 0.85 }),
  }

  const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
  const color = (name) => rgb(getComputedStyle(root).getPropertyValue(name).trim())
  // The four prism colours, with orange and green put back between them (a
  // straight mix of yellow and blue would pass through grey).
  function spectrum() {
    const [a, b, c, d] = [1, 2, 3, 4].map((i) => color(`--prism-${i}`))
    const orange = a.map((v, i) => (v + b[i]) / 2)
    const green = [Math.min(b[0], c[0]) * 0.9, Math.max(b[1], c[1]) * 0.98, (b[2] + c[2]) / 2]
    return [a, orange, b, green, c, d].flat()
  }

  // The scroll. Each glass below the hero folds together as it reaches the
  // middle of the screen and comes apart as it leaves; the hero's opens as the
  // page scrolls away from it; the closing one meets again, seam lit, at the
  // foot of the page. Eased toward the scroll and drawn at the screen's rate
  // while it moves, then back to ten frames a second.
  const clamp = (v) => Math.min(1, Math.max(0, v))
  const smooth = (t) => t * t * (3 - 2 * t)
  function goal(lens) {
    if (still.matches) return 0
    const box = lens.canvas.getBoundingClientRect()
    if (lens.canvas.dataset.lens === 'hero') return smooth(clamp(-box.top / (box.height * 0.85)))
    const vh = innerHeight
    const mid = box.top + box.height / 2
    const end = mid - (root.scrollHeight - vh - scrollY) // where its middle will be at the foot of the page
    return smooth(clamp(Math.abs(mid - Math.max(vh / 2, end)) / (vh * 0.75)))
  }

  // The page's ground as it drifts (motion.js sets --drift; styles.css mixes the same 50%).
  const DRIFT = 0.5
  let base = null
  function ground() {
    const d = parseFloat(root.style.getPropertyValue('--drift')) || 0
    return base.ground.map((v, i) => v + (base.mist[i] - v) * d * DRIFT)
  }

  let worker = null
  let running = false
  let timer = 0
  let clock = 40 // a composed moment to open on
  let last = 0

  // Back to the CSS glass, for good.
  function stop() {
    worker?.terminate()
    worker = null
    running = false
    clearTimeout(timer)
    delete root.dataset.glass
    for (const lens of lenses) lens.canvas.classList.remove('is-on')
  }

  // Where and how large a canvas is. Read on arrival and on resize, not per frame.
  function measure(lens) {
    const box = lens.canvas.getBoundingClientRect()
    if (!box.width || !box.height) return (lens.view = null)
    let px = Math.min(devicePixelRatio || 1, MAX_DPR)
    px = Math.min(px, Math.sqrt(MAX_PIXELS / (box.width * box.height)))
    const name = lens.canvas.dataset.lens
    lens.view = { id: lenses.indexOf(lens), w: Math.round(box.width * px), h: Math.round(box.height * px), px, mirror: 1, seam: 0, tilt: 0, depth: 1, hero: name === 'hero' ? 1 : 0, ...place[name](box) }
  }

  // Asks the worker for a frame. A canvas still waiting for its last one is
  // skipped, so a slow machine simply gets fewer frames.
  function draw(lens) {
    if (!worker || lens.busy || !lens.view) return
    lens.busy = true
    worker.postMessage({ ...lens.view, time: clock, part: lens.part, ground: ground() })
  }

  function show({ id, bitmap }) {
    const lens = lenses[id]
    lens.busy = false
    if (lens.canvas.width !== bitmap.width || lens.canvas.height !== bitmap.height) {
      lens.canvas.width = bitmap.width
      lens.canvas.height = bitmap.height
    }
    lens.ctx ||= lens.canvas.getContext('bitmaprenderer')
    lens.ctx.transferFromImageBitmap(bitmap)
    lens.canvas.classList.add('is-on')
    // Resized while this frame was on its way: ask again at the new size.
    if (lens.view && (lens.view.w !== lens.canvas.width || lens.view.h !== lens.canvas.height)) draw(lens)
  }

  function frame() {
    if (!running) return
    const now = performance.now()
    clock += Math.min(now - last, 250) / 1000
    last = now
    for (const lens of lenses) if (lens.seen) draw(lens)
    timer = setTimeout(() => requestAnimationFrame(frame), 1000 / FPS)
  }

  function sync() {
    const run = !!worker && !document.hidden && !still.matches && lenses.some((lens) => lens.seen)
    if (run === running) return
    running = run
    clearTimeout(timer)
    last = performance.now()
    if (running) requestAnimationFrame(frame)
  }

  function ready() {
    root.dataset.glass = 'shader'
    // Drawn once a little before it scrolls in; kept moving only while on screen.
    const watch = (margin, act) => {
      const observer = new IntersectionObserver((entries) => {
        for (const entry of entries) act(lenses.find((lens) => lens.canvas === entry.target), entry.isIntersecting)
        sync()
      }, { rootMargin: margin })
      for (const lens of lenses) observer.observe(lens.canvas)
    }
    const first = (lens) => {
      if (lens.view) return
      measure(lens)
      lens.part = goal(lens) // where it already is, without gliding there
      draw(lens)
    }
    watch('300px', (lens, near) => near && first(lens))
    watch('0px', (lens, seen) => {
      lens.seen = seen
      if (seen) first(lens)
    })
    document.addEventListener('visibilitychange', sync)
    const again = () => {
      for (const lens of lenses) {
        if (!lens.view) continue
        measure(lens)
        draw(lens)
      }
    }
    let pending = 0
    addEventListener('resize', () => {
      cancelAnimationFrame(pending)
      pending = requestAnimationFrame(again)
    })
    document.fonts?.ready.then(again)

    // The easing moves every frame, but the shader is asked for at most 30 frames a
    // second: the forms are soft, and a full-rate redraw of the hero can take the
    // GPU time the rest of the page (the top bar's slide) needs to stay smooth.
    const GLIDE_MS = 1000 / 30
    let gliding = false
    let drawn = 0
    function glide(now) {
      gliding = false
      const paint = now - drawn >= GLIDE_MS
      if (paint) drawn = now
      for (const lens of lenses) {
        if (!lens.view) continue
        const to = goal(lens)
        lens.part = Math.abs(to - lens.part) < 0.002 ? to : lens.part + (to - lens.part) * 0.2
        if (lens.part !== to) gliding = true
        if (lens.seen && (paint || !gliding)) draw(lens)
      }
      if (gliding) requestAnimationFrame(glide)
    }
    addEventListener('scroll', () => {
      if (gliding || !worker || still.matches) return
      gliding = true
      requestAnimationFrame(glide)
    }, { passive: true })
  }

  function boot() {
    if (ask === 'css' || !lenses.length || !window.Worker || !window.OffscreenCanvas || !window.ImageBitmapRenderingContext) return
    try {
      worker = new Worker(src)
    } catch {
      return
    }
    worker.onerror = stop
    worker.onmessage = ({ data }) => {
      if (data.bitmap) show(data)
      else if (data.ready) ready()
      else stop()
    }
    const colors = {}
    for (const name of ['ground', 'mist', 'sky', 'core', 'deep']) colors[name] = color(`--${name}`)
    base = { ground: colors.ground, mist: colors.mist }
    worker.postMessage({ start: { colors, prism: spectrum(), force: ask === 'shader' } })
  }

  // After the first paint, so the page is never waiting on any of this.
  requestAnimationFrame(() => setTimeout(boot))
}
