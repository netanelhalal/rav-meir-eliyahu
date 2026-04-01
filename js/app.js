/* ─────────────────────────────────────────────────────
   app.js — Scroll-driven canvas frame animation
   Sections: about · teachings · stats · books · cta
   192 frames, 24fps, GSAP + Lenis + ScrollTrigger
───────────────────────────────────────────────────── */

const FRAME_COUNT  = 192;
const FRAME_SPEED  = 2.0;   // animation finishes at ~50% scroll
const IMAGE_SCALE  = 0.87;  // padded cover mode sweet spot

// ── DOM refs ──────────────────────────────────────────
const loader       = document.getElementById('loader');
const loaderBar    = document.getElementById('loader-bar');
const loaderPct    = document.getElementById('loader-percent');
const heroSection  = document.getElementById('hero');
const canvasWrap   = document.getElementById('canvas-wrap');
const canvas       = document.getElementById('canvas');
const ctx          = canvas.getContext('2d');
const darkOverlay  = document.getElementById('dark-overlay');
const marqueeWrap  = document.getElementById('marquee-wrap');
const scrollCont   = document.getElementById('scroll-container');

// ── State ─────────────────────────────────────────────
const frames   = new Array(FRAME_COUNT).fill(null);
let   bgColor  = '#080c18';
let   currentFrame = 0;
let   allLoaded    = false;

// ── Canvas resize ─────────────────────────────────────
const dpr = window.devicePixelRatio || 1;
function resizeCanvas() {
  canvas.width  = window.innerWidth  * dpr;
  canvas.height = window.innerHeight * dpr;
  canvas.style.width  = window.innerWidth  + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx.scale(dpr, dpr);
  drawFrame(currentFrame);
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// ── Draw frame ────────────────────────────────────────
function drawFrame(index) {
  const img = frames[index];
  if (!img) return;
  const cw = canvas.width  / dpr;
  const ch = canvas.height / dpr;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(cw / iw, ch / ih) * IMAGE_SCALE;
  const dw = iw * scale, dh = ih * scale;
  const dx = (cw - dw) / 2, dy = (ch - dh) / 2;
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, cw, ch);
  ctx.drawImage(img, dx, dy, dw, dh);
}

// ── Sample background color from frame edges ──────────
function sampleBgColor(img) {
  const tmp = document.createElement('canvas');
  tmp.width = 16; tmp.height = 16;
  const tctx = tmp.getContext('2d');
  tctx.drawImage(img, 0, 0, 16, 16);
  const d = tctx.getImageData(0, 0, 1, 1).data;
  bgColor = `rgb(${d[0]},${d[1]},${d[2]})`;
}

// ── Frame loader ──────────────────────────────────────
function framePath(i) {
  return `frames/frame_${String(i + 1).padStart(4, '0')}.webp`;
}

function loadFrame(i) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => { frames[i] = img; resolve(); };
    img.onerror = () => resolve();
    img.src = framePath(i);
  });
}

async function preloadFrames() {
  // Phase 1: first 12 frames — fast first paint
  const phase1 = Array.from({ length: 12 }, (_, i) => loadFrame(i));
  await Promise.all(phase1);
  if (frames[0]) { sampleBgColor(frames[0]); drawFrame(0); }

  // Phase 2: remaining frames — background load with progress
  let loaded = 12;
  const updateProgress = () => {
    const pct = Math.round((loaded / FRAME_COUNT) * 100);
    loaderBar.style.width  = pct + '%';
    loaderPct.textContent  = pct + '%';
  };
  updateProgress();

  const remaining = Array.from({ length: FRAME_COUNT - 12 }, (_, i) =>
    loadFrame(i + 12).then(() => { loaded++; updateProgress(); })
  );
  await Promise.all(remaining);

  allLoaded = true;
  loader.classList.add('hidden');
  initAnimations();
}

// ── Lenis smooth scroll ───────────────────────────────
function initLenis() {
  const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

// ── Section positioning ───────────────────────────────
function positionSections() {
  const totalH = scrollCont.offsetHeight;
  document.querySelectorAll('.scroll-section').forEach(sec => {
    const enter = parseFloat(sec.dataset.enter) / 100;
    const leave = parseFloat(sec.dataset.leave) / 100;
    const mid   = (enter + leave) / 2;
    sec.style.top = (mid * totalH) + 'px';
  });
}

// ── Section animation setup ───────────────────────────
function setupSectionAnimation(section) {
  const type    = section.dataset.animation;
  const persist = section.dataset.persist === 'true';
  const enter   = parseFloat(section.dataset.enter) / 100;
  const leave   = parseFloat(section.dataset.leave) / 100;

  const children = section.querySelectorAll(
    '.section-label, .section-heading, .section-body, .section-note, .cta-button, .stat'
  );

  const tl = gsap.timeline({ paused: true });

  switch (type) {
    case 'fade-up':
      tl.from(children, { y: 50, opacity: 0, stagger: 0.12, duration: 0.9, ease: 'power3.out' });
      break;
    case 'slide-left':
      tl.from(children, { x: -80, opacity: 0, stagger: 0.14, duration: 0.9, ease: 'power3.out' });
      break;
    case 'slide-right':
      tl.from(children, { x: 80, opacity: 0, stagger: 0.14, duration: 0.9, ease: 'power3.out' });
      break;
    case 'scale-up':
      tl.from(children, { scale: 0.85, opacity: 0, stagger: 0.12, duration: 1.0, ease: 'power2.out' });
      break;
    case 'rotate-in':
      tl.from(children, { y: 40, rotation: 3, opacity: 0, stagger: 0.1, duration: 0.9, ease: 'power3.out' });
      break;
    case 'stagger-up':
      tl.from(children, { y: 60, opacity: 0, stagger: 0.15, duration: 0.8, ease: 'power3.out' });
      break;
    case 'clip-reveal':
      tl.from(children, { clipPath: 'inset(100% 0 0 0)', opacity: 0, stagger: 0.15, duration: 1.2, ease: 'power4.inOut' });
      break;
  }

  let played    = false;
  let persisted = false;

  ScrollTrigger.create({
    trigger: scrollCont,
    start: 'top top',
    end: 'bottom bottom',
    scrub: false,
    onUpdate: (self) => {
      const p = self.progress;
      const inRange  = p >= enter && p <= leave;
      const pastLeave = p > leave;

      if (persist && pastLeave && played) {
        // keep visible — don't reverse
        if (!persisted) {
          section.classList.add('active');
          persisted = true;
        }
        return;
      }

      if (inRange) {
        section.classList.add('active');
        gsap.set(section, { opacity: 1 });
        if (!played) { tl.play(); played = true; }
      } else {
        section.classList.remove('active');
        if (played && !persist) {
          gsap.set(section, { opacity: 0 });
          tl.reverse();
          played = false;
        }
      }
    },
  });
}

// ── Counter animations ────────────────────────────────
function initCounters() {
  document.querySelectorAll('.stat-number[data-value]').forEach(el => {
    const target   = parseFloat(el.dataset.value);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const obj      = { val: 0 };
    el.textContent = '0';

    gsap.to(obj, {
      val: target,
      duration: 2,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el.closest('.scroll-section'),
        start: 'top 80%',
        toggleActions: 'play none none reset',
      },
      onUpdate() {
        el.textContent = decimals === 0
          ? Math.round(obj.val).toString()
          : obj.val.toFixed(decimals);
      },
      onComplete() {
        el.textContent = decimals === 0 ? Math.round(target).toString() : target.toFixed(decimals);
      },
    });
  });
}

// ── Marquee ───────────────────────────────────────────
function initMarquee() {
  const speed = parseFloat(marqueeWrap.dataset.scrollSpeed) || -22;
  gsap.to(marqueeWrap.querySelector('.marquee-text'), {
    xPercent: speed,
    ease: 'none',
    scrollTrigger: {
      trigger: scrollCont,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
    },
  });
}

// ── Dark overlay ──────────────────────────────────────
function initDarkOverlay(enter, leave) {
  const fadeRange = 0.04;
  ScrollTrigger.create({
    trigger: scrollCont,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;
      let opacity = 0;
      if      (p >= enter - fadeRange && p <= enter) opacity = (p - (enter - fadeRange)) / fadeRange;
      else if (p > enter && p < leave)               opacity = 0.9;
      else if (p >= leave && p <= leave + fadeRange)  opacity = 0.9 * (1 - (p - leave) / fadeRange);
      darkOverlay.style.opacity = opacity;
    },
  });
}

// ── Hero transition + canvas circle-wipe ─────────────
function initHeroTransition() {
  ScrollTrigger.create({
    trigger: scrollCont,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const p = self.progress;

      // Hero fades as scroll begins
      heroSection.style.opacity = Math.max(0, 1 - p * 18).toString();

      // Canvas reveals via expanding circle
      const wipeProgress = Math.min(1, Math.max(0, (p - 0.008) / 0.07));
      const radius = wipeProgress * 80;
      canvasWrap.style.clipPath = `circle(${radius}% at 50% 50%)`;

      // Marquee visible during middle scroll range
      if (p > 0.12 && p < 0.9) {
        marqueeWrap.classList.add('visible');
      } else {
        marqueeWrap.classList.remove('visible');
      }
    },
  });
}

// ── Frame-to-scroll binding ───────────────────────────
function initFrameScroll() {
  ScrollTrigger.create({
    trigger: scrollCont,
    start: 'top top',
    end: 'bottom bottom',
    scrub: true,
    onUpdate: (self) => {
      const accelerated = Math.min(self.progress * FRAME_SPEED, 1);
      const idx = Math.min(Math.floor(accelerated * FRAME_COUNT), FRAME_COUNT - 1);
      if (idx !== currentFrame) {
        currentFrame = idx;
        if (idx % 20 === 0 && frames[idx]) sampleBgColor(frames[idx]);
        requestAnimationFrame(() => drawFrame(currentFrame));
      }
    },
  });
}

// ── Main init (after all frames loaded) ───────────────
function initAnimations() {
  gsap.registerPlugin(ScrollTrigger);
  initLenis();
  positionSections();

  initHeroTransition();
  initFrameScroll();

  document.querySelectorAll('.scroll-section').forEach(sec => {
    setupSectionAnimation(sec);
  });

  initCounters();
  initMarquee();

  // Stats section gets dark overlay (55%–72%)
  initDarkOverlay(0.55, 0.72);

  // Scroll-to-about on arrow click
  document.querySelector('.scroll-indicator')?.addEventListener('click', () => {
    scrollCont.scrollIntoView({ behavior: 'smooth' });
  });
}

// ── Start loading ─────────────────────────────────────
preloadFrames();
