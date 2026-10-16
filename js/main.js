/* =====================================================================
   PRODUCT EXPLORER CONFIG
   Frames are the 8 cutouts in 45° steps (index 0 = CUTOUT_001 ... 7 = 008).
   Hotspot coordinates are in stage pixels on a 1100 × 900 canvas.
   A feature only shows a hotspot on the frames listed in `pts`.
   `best` is the frame the product spins to when that feature is opened.
   `photo` is the full-size image shown on mobile when the feature is opened.
   ===================================================================== */
const START_FRAME = 2;          // CUTOUT_003 — matches the design
const STEP_MS = 85;             // time per 45° step when auto-spinning
const DRAG_PX_PER_FRAME = 70;   // drag distance for one 45° step
const FEATURES = [
  { id:'tubfloor', photo:'images/p_tubfloor.jpg', title:'Open tub floor', best:0, img:'images/c_tubfloor.jpg',
    lead:'Fewer ribs, faster processing.',
    body:'Fewer ribs over the rotor let more material through, with less build-up from sticky material like manure. A side opening prevents blockages, and the side guards are easy to reach for maintenance.',
    pts:{0:[718,368],1:[434,365],2:[449,325],3:[450,360],4:[599,364],5:[377,350],6:[427,391],7:[650,350]} },
  { id:'hammers', photo:'images/p_hammers.jpg', title:'Quick switch hammers', best:4, img:'images/c_hammers.jpg',
    lead:'Less downtime.',
    body:'The back hammers wear twice as fast, so you only change those. Split rods and a quick-release plate mean half a set comes out with the rotor still in the machine.',
    pts:{3:[210,560],4:[517,561],5:[377,514],6:[603,558],7:[850,560]} },
  { id:'torque', photo:'images/p_torque.jpg', title:'Higher torque tub drive', best:7, img:'images/c_torque.jpg',
    lead:'Keeps its speed.',
    body:'25% more torque and a bigger motor keep dense material moving, for a more consistent chop.',
    pts:{0:[728,452],1:[556,416],2:[298,406],3:[620,440],4:[525,438],5:[339,446],6:[295,470],7:[600,420]} },
  { id:'hydraulics', photo:'images/p_hydraulics.jpg', title:'Optimised hydraulics', best:3, img:'images/c_hydraulics.jpg',
    lead:'Works longer.',
    body:'Dedicated valves for the tub, conveyor drive, and conveyor angle and folding put power where it’s needed and take the strain off components.',
    pts:{1:[570,564],2:[510,608],3:[760,630],4:[845,602]} },
  { id:'conveyor', photo:'images/p_conveyor.jpg', title:'Conveyor', best:6, img:'images/c_conveyor.jpg',
    lead:'Longer belt life.',
    body:'Belt tracking keeps the belt aligned, and a scraper brush clears build-up before it jams. Angle and folding are set from the cab.',
    pts:{0:[655,247],1:[540,206],2:[429,194],3:[150,370],4:[279,561],5:[531,571],6:[761,541],7:[940,400]} },
  { id:'controller', photo:'images/p_controller.jpg', title:'WiFi control desk', best:2, img:'images/c_controller.jpg',
    lead:'Run it from the cab.',
    body:'A portable colour control desk handles power loading, play and pause, conveyor angle and folding, and parks the tub for transport at the push of a button. It also shows oil temperature, tub speed, service reminders, and total and job hours.',
    pts:{0:[445,479],1:[483,447],2:[580,436],3:[760,530],7:[300,480]} },
];
const FRAME_COUNT = 8, W = 1100, H = 900;

const stage = document.getElementById('stage');
const spotsEl = document.getElementById('spots');
const zoom = document.getElementById('zoom');
const zoomImg = document.getElementById('zoomImg');
const acc = document.getElementById('acc');
const frames = [...stage.querySelectorAll('.stage__frame')];

let frame = START_FRAME, openId = null, spinTimer = null;

/* ---- accordion ---- */
FEATURES.forEach(f => {
  const li = document.createElement('li');
  li.className = 'acc__item'; li.dataset.id = f.id;
  li.innerHTML = `<button class="acc__head" aria-expanded="false" aria-controls="p-${f.id}"><span class="acc__icon" aria-hidden="true"></span><span class="acc__title">${f.title}</span></button>
    <div class="acc__panel" id="p-${f.id}" role="region"><div><p>${f.body}</p></div></div>`;
  li.querySelector('button').addEventListener('click', () => toggle(f.id));
  acc.appendChild(li);
});

/* ---- hotspots ---- */
const spotEls = {};
FEATURES.forEach(f => {
  const b = document.createElement('button');
  b.className = 'spot'; b.type = 'button';
  b.setAttribute('aria-label', f.title);
  b.innerHTML = '<i aria-hidden="true"></i>';
  b.addEventListener('click', e => { e.stopPropagation(); if (!suppressClick) toggle(f.id); });
  b.addEventListener('pointerdown', e => e.stopPropagation());
  spotsEl.appendChild(b); spotEls[f.id] = b;
});

function showFrame(i){
  frame = (i % FRAME_COUNT + FRAME_COUNT) % FRAME_COUNT;
  frames.forEach((im, k) => im.classList.toggle('is-current', k === frame));
}

function renderSpots(){
  FEATURES.forEach(f => {
    const b = spotEls[f.id], p = f.pts[frame];
    b.hidden = !p;
    b.classList.toggle('is-open', f.id === openId);
    b.setAttribute('aria-expanded', f.id === openId);
    if (p){ b.style.left = p[0]/W*100 + '%'; b.style.top = p[1]/H*100 + '%'; }
  });
  const f = FEATURES.find(x => x.id === openId);
  const p = f && f.pts[frame];
  if (!p){ zoom.classList.remove('is-visible'); return; }
  zoomImg.src = f.img;
  const fx = p[0]/W > .6, fy = p[1]/H > .62;
  zoom.classList.toggle('flip-x', fx); zoom.classList.toggle('flip-y', fy);
  zoom.style.left  = fx ? 'auto' : p[0]/W*100 + '%';
  zoom.style.right = fx ? (100 - p[0]/W*100) + '%' : 'auto';
  zoom.style.top   = fy ? 'auto' : p[1]/H*100 + '%';
  zoom.style.bottom= fy ? (100 - p[1]/H*100) + '%' : 'auto';
  requestAnimationFrame(() => zoom.classList.add('is-visible'));
}

function settled(){
  renderSpots();
  if (isMobile() && openId) showPhoto();
}

function renderAccordion(){
  acc.classList.toggle('has-open', !!openId);
  renderPills();
  acc.querySelectorAll('.acc__item').forEach(li => {
    const open = li.dataset.id === openId;
    li.classList.toggle('is-open', open);
    li.querySelector('button').setAttribute('aria-expanded', open);
  });
}

function toggle(id){
  if (openId === id){            // close
    openId = null;
    zoom.classList.remove('is-visible');
    stage.classList.remove('is-photo');
    if (isMobile()) closeBox();
    renderAccordion(); renderSpots();
    return;
  }
  openId = id;
  if (isMobile()) boxShow(FEATURES.find(f => f.id === id));
  zoom.classList.remove('is-visible');
  renderAccordion();
  spinTo(FEATURES.find(f => f.id === id).best);
}

function stopSpin(){ clearInterval(spinTimer); spinTimer = null; }

function spinTo(target){
  stopSpin();
  let diff = ((target - frame) % FRAME_COUNT + FRAME_COUNT) % FRAME_COUNT;
  if (diff > FRAME_COUNT/2) diff -= FRAME_COUNT;    // shortest way round
  if (diff === 0){ settled(); return; }
  const dir = Math.sign(diff); let left = Math.abs(diff);
  stage.classList.add('is-moving');
  spinTimer = setInterval(() => {
    showFrame(frame + dir);
    if (--left === 0){
      stopSpin();
      stage.classList.remove('is-moving');
      settled();
    }
  }, STEP_MS);
}

/* ---- drag to rotate (no snapping back) ---- */
let drag = null, suppressClick = false;
stage.addEventListener('pointerdown', e => {
  if (e.button !== 0 || stage.classList.contains('is-photo')) return;
  drag = { x:e.clientX, y:e.clientY, start:frame, active:false, id:e.pointerId };
});
window.addEventListener('pointermove', e => {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.x;
  if (!drag.active){
    if (Math.abs(dx) < 6) return;
    if (e.pointerType !== 'mouse' && Math.abs(e.clientY - drag.y) > Math.abs(dx)){ drag = null; return; } // vertical scroll
    drag.active = true; stopSpin();
    try { stage.setPointerCapture(e.pointerId); } catch(_) {}
    stage.classList.add('is-moving','is-dragging','was-dragged');
  }
  showFrame(drag.start + Math.round(dx / DRAG_PX_PER_FRAME));
});
function endDrag(){
  if (!drag) return;
  if (drag.active){
    suppressClick = true; setTimeout(() => suppressClick = false, 0);
    stage.classList.remove('is-moving','is-dragging');
    renderSpots();
  }
  drag = null;
}
window.addEventListener('pointerup', endDrag);
window.addEventListener('pointercancel', endDrag);
stage.addEventListener('dragstart', e => e.preventDefault());

/* keyboard rotation */
stage.addEventListener('keydown', e => {
  if (e.target !== stage) return;
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight'){
    e.preventDefault(); stopSpin(); stage.classList.remove('is-moving');
    showFrame(frame + (e.key === 'ArrowRight' ? 1 : -1)); renderSpots();
  }
});

/* =================== Mobile: feature pills + photo view =================== */
const mq = matchMedia('(max-width:700px)');
const isMobile = () => mq.matches;
const pillsEl = document.getElementById('pills');
const mPhotos = document.getElementById('mPhotos');
const box = document.getElementById('mBox');
const boxTitle = document.getElementById('mTitle');
const boxText = document.getElementById('mText');
const pillEls = {}, photoEls = {};
const EASE_MS = 380;
let boxId = null, boxTimer = null;

FEATURES.forEach(f => {
  const b = document.createElement('button');
  b.className = 'pill'; b.type = 'button'; b.setAttribute('role','listitem');
  b.innerHTML = `<i aria-hidden="true"></i>${f.title}`;
  b.addEventListener('click', () => toggle(f.id));
  pillsEl.appendChild(b); pillEls[f.id] = b;
  const im = document.createElement('img');
  im.alt = f.title; im.loading = 'lazy'; im.decoding = 'async'; im.src = f.photo;
  mPhotos.appendChild(im); photoEls[f.id] = im;
});

function renderPills(){
  FEATURES.forEach(f => pillEls[f.id].setAttribute('aria-pressed', f.id === openId));
}

/* the box's full-width size for the current text */
function boxTarget(){
  const w = stage.clientWidth - 24;
  const prev = [box.style.transition, box.style.width, box.style.height];
  box.style.transition = 'none'; box.style.width = w + 'px'; box.style.height = 'auto';
  const h = box.offsetHeight;
  [box.style.transition, box.style.width, box.style.height] = prev;
  return { left:12, width:w, height:h };
}
/* where a pill sits, in the stage's coordinates (kept inside the stage) */
function pillRect(id){
  const s = stage.getBoundingClientRect(), p = pillEls[id].getBoundingClientRect();
  const width = Math.min(p.width, s.width - 24);
  return { left: Math.min(Math.max(p.left - s.left, 12), s.width - 12 - width), width, height:56 };
}
function place(r){ box.style.left = r.left + 'px'; box.style.width = r.width + 'px'; box.style.height = r.height + 'px'; }
function centreDot(id){                 // keep the open feature's dot in the middle of the row
  if (boxId !== id) return;
  const p = pillEls[id];
  const pr = p.getBoundingClientRect(), cr = pillsEl.getBoundingClientRect();
  pillsEl.scrollTo({ left: pillsEl.scrollLeft + (pr.left + pr.width / 2) - (cr.left + cr.width / 2), behavior:'smooth' });
}
function setPillOut(id){ FEATURES.forEach(f => pillEls[f.id].classList.toggle('is-out', f.id === id)); }

/* open from the pill, or switch text if already open */
function boxShow(f){
  clearTimeout(boxTimer);
  if (box.classList.contains('is-open')){       // already open: swap the text
    box.classList.remove('show-text');
    box.style.height = box.offsetHeight + 'px';
    boxTimer = setTimeout(() => {
      boxTitle.textContent = f.title; boxText.textContent = f.body;
      const t = boxTarget(); box.offsetHeight; place(t);
      box.classList.add('show-text');
      boxTimer = setTimeout(() => box.style.height = 'auto', EASE_MS);
    }, 160);
  } else {                                      // grow up out of the pill
    boxTitle.textContent = f.title; boxText.textContent = f.body;
    const t = boxTarget(), start = pillRect(f.id);
    box.style.transition = 'none'; place(start);
    box.classList.add('is-open'); box.offsetHeight;
    box.style.transition = ''; place(t);
    boxTimer = setTimeout(() => { box.classList.add('show-text'); box.style.height = 'auto'; }, EASE_MS - 60);
  }
  boxId = f.id; setPillOut(f.id); mClose.classList.add('is-open'); updateArrows();
  setTimeout(() => centreDot(f.id), EASE_MS);
}

/* shrink back into the pill's spot, then hand over to the pill */
function closeBox(){
  if (!boxId) return;
  clearTimeout(boxTimer);
  const id = boxId, pill = pillEls[id]; boxId = null; mClose.classList.remove('is-open'); updateArrows();
  box.classList.remove('show-text');
  box.style.height = box.offsetHeight + 'px';
  pill.style.transition = 'none'; pill.classList.remove('is-out'); pill.style.opacity = '0';
  pillsEl.scrollLeft = pill.offsetLeft - (pillsEl.clientWidth - pill.offsetWidth) / 2;
  const r = pillRect(id); box.offsetHeight;
  place(r);
  boxTimer = setTimeout(() => {
    box.classList.remove('is-open');
    pill.style.opacity = ''; pill.style.transition = '';
  }, EASE_MS);
}

function showPhoto(){
  const f = FEATURES.find(x => x.id === openId);
  if (!f) return;
  FEATURES.forEach(x => photoEls[x.id].classList.toggle('is-current', x.id === f.id));
  stage.classList.add('is-photo');
}

function step(dir){                     // previous / next feature (stops at either end)
  const i = FEATURES.findIndex(f => f.id === openId);
  const f = FEATURES[i + dir];
  if (!f) return;
  openId = f.id;
  stopSpin(); showFrame(f.best);       // keep the machine in step behind the photo
  boxShow(f);
  renderAccordion(); renderSpots(); showPhoto();
}

const pillbar = document.getElementById('pillbar');
const pPrev = document.getElementById('pPrev'), pNext = document.getElementById('pNext');
function updateArrows(){
  const i = FEATURES.findIndex(f => f.id === boxId);
  pillbar.classList.toggle('is-open', i > -1);
  pPrev.disabled = i <= 0;
  pNext.disabled = i < 0 || i >= FEATURES.length - 1;
}
pPrev.addEventListener('click', () => step(-1));
pNext.addEventListener('click', () => step(1));

/* drag the pill row with a mouse (touch scrolls natively) */
let pdrag = null;
pillsEl.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'mouse' || e.button !== 0) return;
  pdrag = { x:e.clientX, left:pillsEl.scrollLeft, moved:false };
});
window.addEventListener('pointermove', e => {
  if (!pdrag) return;
  const dx = e.clientX - pdrag.x;
  if (!pdrag.moved && Math.abs(dx) > 5){ pdrag.moved = true; pillsEl.classList.add('is-dragging'); }
  if (pdrag.moved) pillsEl.scrollLeft = pdrag.left - dx;
});
window.addEventListener('pointerup', () => {
  if (!pdrag) return;
  if (pdrag.moved) setTimeout(() => pillsEl.classList.remove('is-dragging'), 0);
  pdrag = null;
});

const mClose = document.getElementById('mClose');
mClose.addEventListener('click', () => openId && toggle(openId));
mClose.addEventListener('pointerdown', e => e.stopPropagation());
box.addEventListener('pointerdown', e => e.stopPropagation());

/* swipe the photo left / right to move between features */
const mview = document.getElementById('mview');
let swipe = null;
mview.addEventListener('pointerdown', e => { e.stopPropagation(); swipe = { x:e.clientX, y:e.clientY }; });
mview.addEventListener('pointerup', e => {
  if (!swipe) return;
  const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y; swipe = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
});
mview.addEventListener('pointercancel', () => swipe = null);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && isMobile() && openId) toggle(openId); });

/* moving between phone and desktop layouts */
mq.addEventListener('change', () => {
  if (!isMobile()){
    stage.classList.remove('is-photo'); box.classList.remove('is-open','show-text'); mClose.classList.remove('is-open');
    boxId = null; setPillOut(null); updateArrows();
  } else if (openId){
    const f = FEATURES.find(x => x.id === openId);
    boxShow(f); if (!spinTimer) showPhoto();
  }
  renderSpots();
});
window.addEventListener('resize', () => {
  if (!boxId) return;
  box.style.transition = 'none'; box.style.width = (stage.clientWidth - 24) + 'px'; box.style.height = 'auto';
  requestAnimationFrame(() => box.style.transition = '');
});

showFrame(START_FRAME); renderSpots();

/* invite the first interaction */
const io = new IntersectionObserver(es => es.forEach(en => {
  if (en.isIntersecting){ Object.values(spotEls).forEach((b,i) => setTimeout(() => b.classList.add('is-pulse'), i*120)); io.disconnect(); }
}), {threshold:.5});
io.observe(stage);

/* =================== Video: load YouTube only when played =================== */
(() => {
  const frame = document.getElementById('videoFrame');
  const alt = document.getElementById('videoAlt');
  const showAlt = () => alt.classList.add('is-shown');
  /* backup link: only shown if the poster image or the player fails */
  const poster = frame.querySelector('img');
  poster.addEventListener('error', showAlt);
  if (poster.complete && !poster.naturalWidth) showAlt();
  document.getElementById('videoPlay').addEventListener('click', () => {
    const id = frame.dataset.yt;
    if (location.protocol === 'file:') showAlt();      // YouTube refuses to play on pages opened from a computer
    const t = setTimeout(showAlt, 8000);               // player never arrived
    requestAnimationFrame(() => frame.querySelector('iframe').addEventListener('load', () => clearTimeout(t)));
    frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="C120-HD Calibrator in action" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    frame.classList.add('is-playing');
  });
})();

/* =================== Testimonial video: load YouTube only when played =================== */
(() => {
  const f = document.getElementById('reviewFrame');
  document.getElementById('reviewPlay').addEventListener('click', () => {
    f.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${f.dataset.yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="Customer review: Manydown Estate" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
  });
})();

/* =================== Gallery arrows =================== */
const track = document.getElementById('galTrack'), prev = document.getElementById('galPrev'), next = document.getElementById('galNext');
/* drag the gallery with a mouse (touch already swipes) */
let gdrag = null;
track.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'mouse' || e.button !== 0) return;
  gdrag = { x:e.clientX, left:track.scrollLeft, moved:false };
});
window.addEventListener('pointermove', e => {
  if (!gdrag) return;
  const dx = e.clientX - gdrag.x;
  if (!gdrag.moved && Math.abs(dx) > 5){ gdrag.moved = true; track.classList.add('is-dragging'); }
  if (gdrag.moved) track.scrollLeft = gdrag.left - dx;
});
window.addEventListener('pointerup', () => {
  if (!gdrag) return;
  if (gdrag.moved) setTimeout(() => track.classList.remove('is-dragging'), 0);   // stays where you let go
  gdrag = null;
});
track.addEventListener('dragstart', e => e.preventDefault());
const stepW = () => track.querySelector('.card').offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);
prev.onclick = () => track.scrollBy({left:-stepW(), behavior:'smooth'});
next.onclick = () => track.scrollBy({left: stepW(), behavior:'smooth'});
function syncArrows(){
  prev.disabled = track.scrollLeft < 4;
  next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
}
track.addEventListener('scroll', syncArrows, {passive:true}); window.addEventListener('resize', syncArrows); syncArrows();

/* =================== Hero background video =================== */
(() => {
  const v = document.getElementById('heroVideo'), btn = document.getElementById('heroPause');
  if (!v || matchMedia('(prefers-reduced-motion: reduce)').matches) return;   // still image only
  const small = matchMedia('(max-width:700px)').matches;
  v.src = (small && v.dataset.srcMobile) || v.dataset.src;
  v.addEventListener('playing', () => { v.classList.add('is-playing'); btn.hidden = false; }, { once:true });
  v.play().catch(() => {});                       // if autoplay is blocked, the photo stays
  btn.addEventListener('click', () => {
    const paused = !v.paused;
    paused ? v.pause() : v.play();
    btn.classList.toggle('is-paused', paused);
    btn.setAttribute('aria-label', paused ? 'Play background video' : 'Pause background video');
  });
  /* pause when scrolled out of view to save battery */
  new IntersectionObserver(([en]) => {
    if (btn.classList.contains('is-paused')) return;
    en.isIntersecting ? v.play().catch(() => {}) : v.pause();
  }).observe(v);
})();

/* =================== Contact form modal =================== */
(() => {
  const modal = document.getElementById('contactModal'), form = document.getElementById('contactForm');
  const formView = form.querySelector('.modal__form'), done = form.querySelector('.modal__done');
  let lastFocus = null;
  const open = () => {
    lastFocus = document.activeElement;
    formView.hidden = false; done.hidden = true; form.reset();
    form.querySelectorAll('.is-invalid').forEach(f => f.classList.remove('is-invalid'));
    modal.showModal(); document.documentElement.classList.add('modal-open');
    setTimeout(() => form.querySelector('input').focus(), 50);
  };
  const close = () => modal.close();
  modal.addEventListener('close', () => { document.documentElement.classList.remove('modal-open'); lastFocus && lastFocus.focus(); });
  document.querySelectorAll('[data-contact]').forEach(b => b.addEventListener('click', open));
  form.querySelectorAll('[data-close]').forEach(b => b.addEventListener('click', close));
  modal.addEventListener('click', e => { if (e.target === modal) close(); });   // click the backdrop
  form.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll('[required]').forEach(f => {
      const bad = f.type === 'checkbox' ? !f.checked : !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value));
      (f.closest('.field') || f.closest('.check')).classList.toggle('is-invalid', bad);
      if (bad && ok){ f.focus(); ok = false; }
    });
    if (!ok) return;
    formView.hidden = true; done.hidden = false;            // mockup: no data is sent
    done.querySelector('button').focus();
  });
})();

/* =================== Mobile menu =================== */
(() => {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const btn = nav.querySelector('.nav__burger');
  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open);
  });
  nav.querySelectorAll('.nav__menu a').forEach(a => a.addEventListener('click', () => { nav.classList.remove('is-open'); btn.setAttribute('aria-expanded', false); }));
})();

/* =================== Options: one open at a time =================== */
document.querySelectorAll('.oacc__item').forEach(li => {
  li.querySelector('.oacc__head').addEventListener('click', () => {
    const open = !li.classList.contains('is-open');
    document.querySelectorAll('.oacc__item.is-open').forEach(o => { o.classList.remove('is-open'); o.querySelector('.oacc__head').setAttribute('aria-expanded','false'); });
    li.classList.toggle('is-open', open);
    li.querySelector('.oacc__head').setAttribute('aria-expanded', open);
  });
});

/* =================== FAQ =================== */
document.querySelectorAll('.faq__item').forEach(li => {
  li.querySelector('.faq__head').addEventListener('click', () => {
    const open = !li.classList.contains('is-open');
    li.classList.toggle('is-open', open);
    li.querySelector('.faq__head').setAttribute('aria-expanded', open);
  });
});
