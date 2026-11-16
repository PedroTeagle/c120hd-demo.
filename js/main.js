/* =====================================================================
   Teagle C120-HD product page

   Contents
     1. Product explorer: feature data
     2. Product explorer: rotating machine, list and hotspots
     3. Highlights gallery
     4. Hero background video
     5. YouTube videos (load on play)
     6. Contact form modal
     7. Mobile menu
     8. Options and FAQ accordions
     9. Feature carousel (rotor, hopper, hammers)
   ===================================================================== */
'use strict';


/* =====================================================================
   1. Product explorer: feature data

   The machine is shown as 8 photos 45° apart (images/f1–f8.webp,
   frame index 0–7). Hotspot positions are in pixels on the photos'
   1100 × 900 canvas.

     best   the frame the machine turns to when the feature opens
     pts    hotspot position on each frame; no entry = no hotspot there
     img    close-up shown in the card next to a hotspot (desktop)
     photo  full-size photo shown behind the feature card (mobile)
   ===================================================================== */
const FEATURES = [
  {
    id: 'tubfloor',
    title: 'Open tub floor',
    body: 'Fewer ribs over the rotor let more material through, with less build-up from sticky material like manure. A side opening prevents blockages, and the side guards are easy to reach for maintenance.',
    best: 0,
    img: 'images/c_tubfloor.jpg',
    photo: 'images/p_tubfloor.jpg',
    pts: { 0: [718, 368], 1: [434, 365], 2: [449, 325], 3: [450, 360], 4: [599, 364], 5: [377, 350], 6: [427, 391], 7: [650, 350] },
  },
  {
    id: 'hammers',
    title: 'Quick switch hammers',
    body: 'The back hammers wear twice as fast, so you only change those. Split rods and a quick-release plate mean half a set comes out with the rotor still in the machine.',
    best: 4,
    img: 'images/c_hammers.jpg',
    photo: 'images/p_hammers.jpg',
    pts: { 3: [210, 560], 4: [517, 561], 5: [377, 514], 6: [603, 558], 7: [850, 560] },
  },
  {
    id: 'torque',
    title: 'Higher torque tub drive',
    body: '25% more torque and a bigger motor keep dense material moving, for a more consistent chop.',
    best: 7,
    img: 'images/c_torque.jpg',
    photo: 'images/p_torque.jpg',
    pts: { 0: [728, 452], 1: [556, 416], 2: [298, 406], 3: [620, 440], 4: [525, 438], 5: [339, 446], 6: [295, 470], 7: [600, 420] },
  },
  {
    id: 'hydraulics',
    title: 'Optimised hydraulics',
    body: 'Dedicated valves for the tub, conveyor drive, and conveyor angle and folding put power where it’s needed and take the strain off components.',
    best: 3,
    img: 'images/c_hydraulics.jpg',
    photo: 'images/p_hydraulics.jpg',
    pts: { 1: [570, 564], 2: [510, 608], 3: [760, 630], 4: [845, 602] },
  },
  {
    id: 'conveyor',
    title: 'Conveyor',
    body: 'Belt tracking keeps the belt aligned, and a scraper brush clears build-up before it jams. Angle and folding are set from the cab.',
    best: 6,
    img: 'images/c_conveyor.jpg',
    photo: 'images/p_conveyor.jpg',
    pts: { 0: [655, 247], 1: [540, 206], 2: [429, 194], 3: [150, 370], 4: [279, 561], 5: [531, 571], 6: [761, 541], 7: [940, 400] },
  },
  {
    id: 'controller',
    title: 'WiFi control desk',
    body: 'A portable colour control desk handles power loading, play and pause, conveyor angle and folding, and parks the tub for transport at the push of a button. It also shows oil temperature, tub speed, service reminders, and total and job hours.',
    best: 2,
    img: 'images/c_controller.jpg',
    photo: 'images/p_controller.jpg',
    pts: { 0: [445, 479], 1: [483, 447], 2: [580, 436], 3: [760, 530], 7: [300, 480] },
  },
];

const START_FRAME = 2;          // the angle shown on load (f3.webp)
const FRAME_COUNT = 8;
const CANVAS_W = 1100;
const CANVAS_H = 900;
const SPIN_STEP_MS = 85;        // time per 45° step when turning to a feature
const DRAG_PX_PER_FRAME = 70;   // drag distance for one 45° step


/* =====================================================================
   2. Product explorer

   One feature can be open at a time (openId). Opening a feature turns
   the machine to its best angle, then shows its hotspot card (desktop)
   or its photo (mobile).
   ===================================================================== */
(function productExplorer() {
  const stage = document.getElementById('stage');
  if (!stage) return;

  const frames = [...stage.querySelectorAll('.stage__frame')];
  const featureList = document.getElementById('featureList');
  const hotspotLayer = document.getElementById('hotspots');
  const spotCard = document.getElementById('spotCard');
  const spotCardImg = document.getElementById('spotCardImg');

  // mobile
  const mobileQuery = matchMedia('(max-width: 700px)');
  const isMobile = () => mobileQuery.matches;
  const pillBar = document.getElementById('pillBar');
  const pillRow = document.getElementById('pills');
  const pillPrev = document.getElementById('pillPrev');
  const pillNext = document.getElementById('pillNext');
  const photoView = document.getElementById('featurePhoto');
  const photoList = document.getElementById('featurePhotoImages');
  const card = document.getElementById('featureCard');
  const cardTitle = document.getElementById('featureCardTitle');
  const cardText = document.getElementById('featureCardText');
  const closeButton = document.getElementById('featureClose');
  const CARD_EASE_MS = 380;     // matches the .feature-card transition in the CSS
  const CARD_INSET = 12;        // gap between the card and the edges of the stage
  const PILL_HEIGHT = 56;

  const hotspots = {};
  const pills = {};
  const photos = {};

  let frame = START_FRAME;
  let openId = null;
  let spinTimer = null;
  let suppressClick = false;    // stops the click that ends a drag from toggling a hotspot

  const getFeature = id => FEATURES.find(f => f.id === id);


  /* ---- Build the list, hotspots, pills and photos ---- */

  FEATURES.forEach(f => {
    const item = document.createElement('li');
    item.className = 'feature-list__item';
    item.dataset.id = f.id;
    item.innerHTML = `
      <button class="feature-list__head" type="button" aria-expanded="false" aria-controls="feature-${f.id}">
        <span class="feature-list__icon" aria-hidden="true"></span>
        <span class="feature-list__title">${f.title}</span>
      </button>
      <div class="feature-list__panel" id="feature-${f.id}" role="region"><div><p>${f.body}</p></div></div>`;
    item.querySelector('button').addEventListener('click', () => toggle(f.id));
    featureList.appendChild(item);

    const spot = document.createElement('button');
    spot.className = 'spot';
    spot.type = 'button';
    spot.setAttribute('aria-label', f.title);
    spot.innerHTML = '<i aria-hidden="true"></i>';
    spot.addEventListener('click', e => {
      e.stopPropagation();
      if (!suppressClick) toggle(f.id);
    });
    spot.addEventListener('pointerdown', e => e.stopPropagation());   // don't start a drag
    hotspotLayer.appendChild(spot);
    hotspots[f.id] = spot;

    const pill = document.createElement('button');
    pill.className = 'pill';
    pill.type = 'button';
    pill.innerHTML = `<i aria-hidden="true"></i>${f.title}`;
    pill.addEventListener('click', () => toggle(f.id));
    pillRow.appendChild(pill);
    pills[f.id] = pill;

    const photo = document.createElement('img');
    photo.alt = f.title;
    photo.decoding = 'async';
    photo.dataset.src = f.photo;      // loaded by loadPhotos() on phones only
    photoList.appendChild(photo);
    photos[f.id] = photo;
  });


  /* ---- Rendering ---- */

  function showFrame(i) {
    frame = (i % FRAME_COUNT + FRAME_COUNT) % FRAME_COUNT;
    frames.forEach((img, k) => img.classList.toggle('is-current', k === frame));
  }

  // place the hotspots for the current frame, and the open feature's photo card
  function renderHotspots() {
    FEATURES.forEach(f => {
      const spot = hotspots[f.id];
      const pt = f.pts[frame];
      spot.hidden = !pt;
      spot.classList.toggle('is-open', f.id === openId);
      spot.setAttribute('aria-expanded', f.id === openId);
      if (pt) {
        spot.style.left = pt[0] / CANVAS_W * 100 + '%';
        spot.style.top = pt[1] / CANVAS_H * 100 + '%';
      }
    });

    const f = getFeature(openId);
    const pt = f && f.pts[frame];
    if (!pt) {
      spotCard.classList.remove('is-visible');
      return;
    }

    // the card opens down and right from the hotspot, flipping near the right and bottom edges
    const x = pt[0] / CANVAS_W * 100;
    const y = pt[1] / CANVAS_H * 100;
    const flipX = x > 60;
    const flipY = y > 62;
    spotCardImg.src = f.img;
    spotCard.classList.toggle('flip-x', flipX);
    spotCard.classList.toggle('flip-y', flipY);
    spotCard.style.left = flipX ? 'auto' : x + '%';
    spotCard.style.right = flipX ? (100 - x) + '%' : 'auto';
    spotCard.style.top = flipY ? 'auto' : y + '%';
    spotCard.style.bottom = flipY ? (100 - y) + '%' : 'auto';
    requestAnimationFrame(() => spotCard.classList.add('is-visible'));
  }

  function renderList() {
    featureList.querySelectorAll('.feature-list__item').forEach(item => {
      const open = item.dataset.id === openId;
      item.classList.toggle('is-open', open);
      item.querySelector('button').setAttribute('aria-expanded', open);
    });
    FEATURES.forEach(f => pills[f.id].setAttribute('aria-pressed', f.id === openId));
  }

  // the mobile photos are only fetched on phones, once the machine is nearly in view
  function loadPhotos() {
    Object.values(photos).forEach(img => {
      if (!img.src) img.src = img.dataset.src;
    });
  }

  function showPhoto() {
    if (!openId) return;
    loadPhotos();
    FEATURES.forEach(f => photos[f.id].classList.toggle('is-current', f.id === openId));
    stage.classList.add('is-photo');
  }

  // called once the machine has stopped turning
  function settled() {
    renderHotspots();
    if (isMobile() && openId) showPhoto();
  }


  /* ---- Opening and closing features ---- */

  function toggle(id) {
    if (openId === id) {
      openId = null;
      spotCard.classList.remove('is-visible');
      stage.classList.remove('is-photo');
      if (isMobile()) closeCard();
      renderList();
      renderHotspots();
      return;
    }

    openId = id;
    const f = getFeature(id);
    if (isMobile()) openCard(f);
    spotCard.classList.remove('is-visible');
    renderList();
    spinTo(f.best);
  }

  // previous / next feature on mobile (stops at either end)
  function step(dir) {
    const f = FEATURES[FEATURES.findIndex(x => x.id === openId) + dir];
    if (!f) return;
    openId = f.id;
    stopSpin();
    showFrame(f.best);          // keep the machine in step behind the photo
    openCard(f);
    renderList();
    renderHotspots();
    showPhoto();
  }


  /* ---- Turning the machine ---- */

  function stopSpin() {
    clearInterval(spinTimer);
    spinTimer = null;
  }

  // step frame by frame to the target, the shortest way round
  function spinTo(target) {
    stopSpin();
    let diff = ((target - frame) % FRAME_COUNT + FRAME_COUNT) % FRAME_COUNT;
    if (diff > FRAME_COUNT / 2) diff -= FRAME_COUNT;
    if (diff === 0) {
      settled();
      return;
    }

    const dir = Math.sign(diff);
    let stepsLeft = Math.abs(diff);
    stage.classList.add('is-moving');
    spinTimer = setInterval(() => {
      showFrame(frame + dir);
      if (--stepsLeft === 0) {
        stopSpin();
        stage.classList.remove('is-moving');
        settled();
      }
    }, SPIN_STEP_MS);
  }

  // drag sideways to rotate. The machine stays where it's left.
  let drag = null;

  stage.addEventListener('pointerdown', e => {
    if (e.button !== 0 || stage.classList.contains('is-photo')) return;
    drag = { x: e.clientX, y: e.clientY, startFrame: frame, active: false, pointerId: e.pointerId };
  });

  window.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    const dx = e.clientX - drag.x;

    if (!drag.active) {
      if (Math.abs(dx) < 6) return;
      // on touch, a mostly vertical movement is a page scroll, not a drag
      if (e.pointerType !== 'mouse' && Math.abs(e.clientY - drag.y) > Math.abs(dx)) {
        drag = null;
        return;
      }
      drag.active = true;
      stopSpin();
      try { stage.setPointerCapture(e.pointerId); } catch (_) { /* pointer already released */ }
      stage.classList.add('is-moving', 'is-dragging', 'was-dragged');
    }

    showFrame(drag.startFrame + Math.round(dx / DRAG_PX_PER_FRAME));
  });

  function endDrag() {
    if (!drag) return;
    if (drag.active) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 0);
      stage.classList.remove('is-moving', 'is-dragging');
      renderHotspots();
    }
    drag = null;
  }

  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  stage.addEventListener('dragstart', e => e.preventDefault());

  // left / right arrow keys rotate when the stage has focus
  stage.addEventListener('keydown', e => {
    if (e.target !== stage || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    stopSpin();
    stage.classList.remove('is-moving');
    showFrame(frame + (e.key === 'ArrowRight' ? 1 : -1));
    renderHotspots();
  });


  /* ---- Mobile: feature card that grows out of its pill ----
     The card's left, width and height are set inline so CSS can animate
     between the pill's size and the full-width card. */

  let cardId = null;
  let cardTimer = null;

  function setCardRect(r) {
    card.style.left = r.left + 'px';
    card.style.width = r.width + 'px';
    card.style.height = r.height + 'px';
  }

  // full-width size for the current text
  function fullCardRect() {
    const width = stage.clientWidth - 2 * CARD_INSET;
    const saved = [card.style.transition, card.style.width, card.style.height];
    card.style.transition = 'none';
    card.style.width = width + 'px';
    card.style.height = 'auto';
    const height = card.offsetHeight;
    [card.style.transition, card.style.width, card.style.height] = saved;
    return { left: CARD_INSET, width, height };
  }

  // where a pill sits, in the stage's coordinates (kept inside the stage)
  function pillRect(id) {
    const s = stage.getBoundingClientRect();
    const p = pills[id].getBoundingClientRect();
    const width = Math.min(p.width, s.width - 2 * CARD_INSET);
    const left = Math.min(Math.max(p.left - s.left, CARD_INSET), s.width - CARD_INSET - width);
    return { left, width, height: PILL_HEIGHT };
  }

  // the open feature's pill becomes a dot
  function markPillOut(id) {
    FEATURES.forEach(f => pills[f.id].classList.toggle('is-out', f.id === id));
  }

  // keep the open feature's dot in the middle of the row
  function centreDot(id) {
    if (cardId !== id) return;
    const pill = pills[id].getBoundingClientRect();
    const row = pillRow.getBoundingClientRect();
    const offset = (pill.left + pill.width / 2) - (row.left + row.width / 2);
    pillRow.scrollTo({ left: pillRow.scrollLeft + offset, behavior: 'smooth' });
  }

  function updateArrows() {
    const i = FEATURES.findIndex(f => f.id === cardId);
    pillBar.classList.toggle('is-open', i > -1);
    pillPrev.disabled = i <= 0;
    pillNext.disabled = i < 0 || i >= FEATURES.length - 1;
  }

  function openCard(f) {
    clearTimeout(cardTimer);
    loadPhotos();

    if (card.classList.contains('is-open')) {
      // already open: fade the text out, swap it, resize, fade back in
      card.classList.remove('show-text');
      card.style.height = card.offsetHeight + 'px';
      cardTimer = setTimeout(() => {
        cardTitle.textContent = f.title;
        cardText.textContent = f.body;
        const target = fullCardRect();
        card.offsetHeight;     // force layout so the size change animates
        setCardRect(target);
        card.classList.add('show-text');
        cardTimer = setTimeout(() => { card.style.height = 'auto'; }, CARD_EASE_MS);
      }, 160);
    } else {
      // grow up and out of the pill
      cardTitle.textContent = f.title;
      cardText.textContent = f.body;
      const target = fullCardRect();
      card.style.transition = 'none';
      setCardRect(pillRect(f.id));
      card.classList.add('is-open');
      card.offsetHeight;       // force layout so the growth animates
      card.style.transition = '';
      setCardRect(target);
      cardTimer = setTimeout(() => {
        card.classList.add('show-text');
        card.style.height = 'auto';
      }, CARD_EASE_MS - 60);
    }

    cardId = f.id;
    markPillOut(f.id);
    closeButton.classList.add('is-open');
    updateArrows();
    setTimeout(() => centreDot(f.id), CARD_EASE_MS);
  }

  // shrink back into the pill's place, then hand over to the pill
  function closeCard() {
    if (!cardId) return;
    clearTimeout(cardTimer);
    const id = cardId;
    const pill = pills[id];
    cardId = null;
    closeButton.classList.remove('is-open');
    updateArrows();

    card.classList.remove('show-text');
    card.style.height = card.offsetHeight + 'px';
    pill.style.transition = 'none';
    pill.classList.remove('is-out');
    pill.style.opacity = '0';
    pillRow.scrollLeft = pill.offsetLeft - (pillRow.clientWidth - pill.offsetWidth) / 2;
    const target = pillRect(id);
    card.offsetHeight;
    setCardRect(target);

    cardTimer = setTimeout(() => {
      card.classList.remove('is-open');
      pill.style.opacity = '';
      pill.style.transition = '';
    }, CARD_EASE_MS);
  }

  pillPrev.addEventListener('click', () => step(-1));
  pillNext.addEventListener('click', () => step(1));

  closeButton.addEventListener('click', () => openId && toggle(openId));
  closeButton.addEventListener('pointerdown', e => e.stopPropagation());
  card.addEventListener('pointerdown', e => e.stopPropagation());

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && isMobile() && openId) toggle(openId);
  });

  // drag the pill row with a mouse (touch scrolls natively)
  let pillDrag = null;
  pillRow.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    pillDrag = { x: e.clientX, scrollLeft: pillRow.scrollLeft, moved: false };
  });
  window.addEventListener('pointermove', e => {
    if (!pillDrag) return;
    const dx = e.clientX - pillDrag.x;
    if (!pillDrag.moved && Math.abs(dx) > 5) {
      pillDrag.moved = true;
      pillRow.classList.add('is-dragging');
    }
    if (pillDrag.moved) pillRow.scrollLeft = pillDrag.scrollLeft - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!pillDrag) return;
    if (pillDrag.moved) setTimeout(() => pillRow.classList.remove('is-dragging'), 0);
    pillDrag = null;
  });

  // swipe the photo left or right to move between features
  let swipe = null;
  photoView.addEventListener('pointerdown', e => {
    e.stopPropagation();
    swipe = { x: e.clientX, y: e.clientY };
  });
  photoView.addEventListener('pointerup', e => {
    if (!swipe) return;
    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
  });
  photoView.addEventListener('pointercancel', () => { swipe = null; });


  /* ---- Switching between the mobile and desktop layouts ---- */

  mobileQuery.addEventListener('change', () => {
    if (!isMobile()) {
      stage.classList.remove('is-photo');
      card.classList.remove('is-open', 'show-text');
      closeButton.classList.remove('is-open');
      cardId = null;
      markPillOut(null);
      updateArrows();
    } else if (openId) {
      openCard(getFeature(openId));
      if (!spinTimer) showPhoto();
    }
    renderHotspots();
  });

  window.addEventListener('resize', () => {
    if (!cardId) return;
    card.style.transition = 'none';
    card.style.width = (stage.clientWidth - 2 * CARD_INSET) + 'px';
    card.style.height = 'auto';
    requestAnimationFrame(() => { card.style.transition = ''; });
  });


  /* ---- Start ---- */

  showFrame(START_FRAME);
  renderHotspots();

  // pulse the hotspots once, the first time the machine is in view
  const pulseObserver = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    Object.values(hotspots).forEach((spot, i) => setTimeout(() => spot.classList.add('is-pulse'), i * 120));
    pulseObserver.disconnect();
  }, { threshold: 0.5 });
  pulseObserver.observe(stage);

  const photoObserver = new IntersectionObserver(entries => {
    if (!isMobile() || !entries.some(entry => entry.isIntersecting)) return;
    loadPhotos();
    photoObserver.disconnect();
  }, { rootMargin: '800px 0px' });
  photoObserver.observe(stage);
})();


/* =====================================================================
   3. Highlights gallery
   Arrows step one card at a time. Touch swipes natively; a mouse can drag.
   ===================================================================== */
(function gallery() {
  const track = document.getElementById('galTrack');
  const prev = document.getElementById('galPrev');
  const next = document.getElementById('galNext');
  if (!track) return;

  const stepWidth = () => track.querySelector('.card').offsetWidth + (parseFloat(getComputedStyle(track).columnGap) || 0);

  prev.addEventListener('click', () => track.scrollBy({ left: -stepWidth(), behavior: 'smooth' }));
  next.addEventListener('click', () => track.scrollBy({ left: stepWidth(), behavior: 'smooth' }));

  function updateArrows() {
    prev.disabled = track.scrollLeft < 4;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
  }

  track.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  updateArrows();

  // mouse drag. The track stays where it's let go.
  let drag = null;
  track.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    drag = { x: e.clientX, scrollLeft: track.scrollLeft, moved: false };
  });
  window.addEventListener('pointermove', e => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) > 5) {
      drag.moved = true;
      track.classList.add('is-dragging');
    }
    if (drag.moved) track.scrollLeft = drag.scrollLeft - dx;
  });
  window.addEventListener('pointerup', () => {
    if (!drag) return;
    if (drag.moved) setTimeout(() => track.classList.remove('is-dragging'), 0);
    drag = null;
  });
  track.addEventListener('dragstart', e => e.preventDefault());
})();


/* =====================================================================
   4. Hero background video
   A smaller file on phones. Starts after the page has loaded. Skipped for
   reduced motion, and if autoplay is blocked the photo stays. Pauses when
   scrolled out of view.
   ===================================================================== */
(function heroVideo() {
  const video = document.getElementById('heroVideo');
  const pauseButton = document.getElementById('heroPause');
  if (!video || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  video.addEventListener('playing', () => {
    video.classList.add('is-playing');
    pauseButton.hidden = false;
  }, { once: true });

  // start once the rest of the page has loaded, so the video doesn't hold up the images
  function start() {
    const isPhone = matchMedia('(max-width: 700px)').matches;
    video.src = (isPhone && video.dataset.srcMobile) || video.dataset.src;
    video.play().catch(() => {});
  }
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start, { once: true });

  pauseButton.addEventListener('click', () => {
    const pausing = !video.paused;
    if (pausing) video.pause();
    else video.play();
    pauseButton.classList.toggle('is-paused', pausing);
    pauseButton.setAttribute('aria-label', pausing ? 'Play background video' : 'Pause background video');
  });

  new IntersectionObserver(([entry]) => {
    if (pauseButton.classList.contains('is-paused')) return;   // paused by the visitor
    if (entry.isIntersecting) video.play().catch(() => {});
    else video.pause();
  }).observe(video);
})();


/* =====================================================================
   5. YouTube videos
   The poster image is swapped for the player only when play is pressed,
   so nothing loads from YouTube until then. Uses youtube-nocookie.com.
   ===================================================================== */
function loadYouTube(container) {
  const params = 'autoplay=1&rel=0&modestbranding=1&playsinline=1';
  const iframe = document.createElement('iframe');
  iframe.src = `https://www.youtube-nocookie.com/embed/${container.dataset.yt}?${params}`;
  iframe.title = container.dataset.title;
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  container.replaceChildren(iframe);
  container.classList.add('is-playing');
  return iframe;
}

(function testimonialVideo() {
  const frame = document.getElementById('reviewFrame');
  if (!frame) return;
  document.getElementById('reviewPlay').addEventListener('click', () => loadYouTube(frame));
})();

(function featureVideo() {
  const frame = document.getElementById('videoFrame');
  const backupLink = document.getElementById('videoAlt');
  if (!frame) return;

  // the "Watch on YouTube" link only shows if the poster or the player fails
  const showBackupLink = () => backupLink.classList.add('is-shown');
  const poster = frame.querySelector('img');
  poster.addEventListener('error', showBackupLink);
  if (poster.complete && !poster.naturalWidth) showBackupLink();

  document.getElementById('videoPlay').addEventListener('click', () => {
    // YouTube won't play on a page opened straight from a computer's files
    if (location.protocol === 'file:') showBackupLink();
    const timeout = setTimeout(showBackupLink, 8000);
    const iframe = loadYouTube(frame);
    iframe.addEventListener('load', () => clearTimeout(timeout));
  });
})();


/* =====================================================================
   6. Contact form modal
   Opened by any element with data-contact. Validates the required
   fields, then shows the thank-you message. Demo only: nothing is sent.
   ===================================================================== */
(function contactForm() {
  const modal = document.getElementById('contactModal');
  const form = document.getElementById('contactForm');
  if (!modal) return;

  const formView = form.querySelector('.modal__form');
  const doneView = form.querySelector('.modal__done');
  let lastFocus = null;

  function open() {
    lastFocus = document.activeElement;
    formView.hidden = false;
    doneView.hidden = true;
    form.reset();
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    modal.showModal();
    document.documentElement.classList.add('modal-open');   // stops the page scrolling behind
    setTimeout(() => form.querySelector('input').focus(), 50);
  }

  const close = () => modal.close();

  modal.addEventListener('close', () => {
    document.documentElement.classList.remove('modal-open');
    if (lastFocus) lastFocus.focus();
  });

  document.querySelectorAll('[data-contact]').forEach(el => el.addEventListener('click', open));
  form.querySelectorAll('[data-close]').forEach(el => el.addEventListener('click', close));
  modal.addEventListener('click', e => { if (e.target === modal) close(); });   // backdrop

  function isInvalid(field) {
    if (field.type === 'checkbox') return !field.checked;
    if (!field.value.trim()) return true;
    return field.type === 'email' && !/^\S+@\S+\.\S+$/.test(field.value);
  }

  form.addEventListener('submit', e => {
    e.preventDefault();
    let firstInvalid = null;
    form.querySelectorAll('[required]').forEach(field => {
      const invalid = isInvalid(field);
      field.closest('.field, .check').classList.toggle('is-invalid', invalid);
      if (invalid && !firstInvalid) firstInvalid = field;
    });

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // demo: show the thank-you message. Connect the form submission here.
    formView.hidden = true;
    doneView.hidden = false;
    doneView.querySelector('button').focus();
  });
})();


/* =====================================================================
   7. Mobile menu
   ===================================================================== */
(function mobileMenu() {
  const nav = document.querySelector('.nav');
  if (!nav) return;
  const burger = nav.querySelector('.nav__burger');

  function setOpen(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
  }

  burger.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  nav.querySelectorAll('.nav__menu a').forEach(link => link.addEventListener('click', () => setOpen(false)));
})();


/* =====================================================================
   8. Options and FAQ accordions
   Options: one open at a time. FAQ: each opens independently.
   ===================================================================== */
function setAccordionItem(item, open) {
  item.classList.toggle('is-open', open);
  item.querySelector('button').setAttribute('aria-expanded', open);
}

document.querySelectorAll('.option-list__item').forEach(item => {
  item.querySelector('.option-list__head').addEventListener('click', () => {
    const open = !item.classList.contains('is-open');
    document.querySelectorAll('.option-list__item.is-open').forEach(other => setAccordionItem(other, false));
    setAccordionItem(item, open);
  });
});

document.querySelectorAll('.faq__item').forEach(item => {
  item.querySelector('.faq__head').addEventListener('click', () => {
    setAccordionItem(item, !item.classList.contains('is-open'));
  });
});


/* =====================================================================
   9. Feature carousel
   Three slides; arrows, dots, swipe or mouse drag anywhere on a slide,
   sideways trackpad scroll and the left/right keys. It loops in both
   directions: copies of the first and last slide sit at either end of the
   track, and after sliding onto a copy the track jumps silently to the
   real slide. A double-click still selects a word; a sideways drag moves
   the slide instead of selecting text.
   ===================================================================== */
(function featureCarousel() {
  const carousel = document.getElementById('featureCarousel');
  if (!carousel) return;

  const track = carousel.querySelector('.feature-carousel__track');
  const slides = [...track.querySelectorAll('.feature-slide')];
  const dotsBox = carousel.querySelector('.feature-carousel__dots');
  const prevButton = carousel.querySelector('.feature-carousel__arrow--prev');
  const nextButton = carousel.querySelector('.feature-carousel__arrow--next');
  const count = slides.length;
  if (count < 2) return;   // a single slide shows as a plain section

  const themeOf = slide => slide.className.match(/feature-slide--(\w+)/)[1];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  // looping copies, hidden from screen readers and the keyboard
  const makeCopy = slide => {
    const copy = slide.cloneNode(true);
    copy.setAttribute('aria-hidden', 'true');
    copy.inert = true;
    copy.removeAttribute('aria-label');
    return copy;
  };
  track.prepend(makeCopy(slides[count - 1]));
  track.append(makeCopy(slides[0]));

  // dots
  const dots = slides.map((slide, i) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.setAttribute('aria-label', `Go to slide ${i + 1} of ${count}`);
    dot.addEventListener('click', () => goTo(i));
    dotsBox.appendChild(dot);
    return dot;
  });

  let index = 0;        // the real slide showing (0 to count - 1)
  let position = 1;     // where the track is, counting the copy at the start
  let moving = false;

  function setTrack(pos, offsetPx = 0, animate = true) {
    track.classList.toggle('no-transition', !animate);
    track.style.transform = `translateX(calc(${-pos * 100}% + ${offsetPx}px))`;
  }

  function update() {
    carousel.dataset.theme = themeOf(slides[index]);
    slides.forEach((slide, i) => {
      slide.inert = i !== index;
      slide.setAttribute('aria-hidden', i !== index);
    });
    dots.forEach((dot, i) => dot.setAttribute('aria-current', i === index));
  }

  // move by one in either direction, looping at the ends
  function step(dir) {
    if (moving) return;
    index = (index + dir + count) % count;
    position += dir;
    update();
    if (reduceMotion.matches) {
      position = index + 1;
      setTrack(position, 0, false);
      return;
    }
    moving = true;
    setTrack(position);
  }

  function goTo(i) {
    if (i === index || moving) return;
    index = i;
    position = i + 1;
    update();
    moving = !reduceMotion.matches;
    setTrack(position, 0, moving);
  }

  // after landing on a copy, jump to the matching real slide without animating
  track.addEventListener('transitionend', e => {
    if (e.target !== track) return;
    moving = false;
    if (position === 0 || position === count + 1) {
      position = index + 1;
      setTrack(position, 0, false);
      track.offsetHeight;   // apply the jump before the next animation
    }
  });

  prevButton.addEventListener('click', () => step(-1));
  nextButton.addEventListener('click', () => step(1));

  carousel.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    if (e.target.closest('input, textarea, select')) return;
    e.preventDefault();
    step(e.key === 'ArrowRight' ? 1 : -1);
  });

  // swipe or mouse drag anywhere on the slide (not on its buttons)
  let drag = null;
  let suppressClick = false;

  track.addEventListener('pointerdown', e => {
    if (moving || e.button !== 0) return;
    if (e.target.closest('button, a, input, textarea, select')) return;
    drag = { x: e.clientX, y: e.clientY, dx: 0, active: false, id: e.pointerId, time: Date.now() };
  });

  window.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.x;
    if (!drag.active) {
      if (Math.abs(drag.dx) < 8) return;
      if (Math.abs(e.clientY - drag.y) > Math.abs(drag.dx)) {   // mostly vertical: let the page scroll
        drag = null;
        return;
      }
      drag.active = true;
      getSelection().removeAllRanges();   // drop any text selection the drag started
      track.classList.add('is-dragging');
      try { track.setPointerCapture(e.pointerId); } catch (_) { /* already released */ }
    }
    setTrack(position, drag.dx, false);
  });

  function endDrag() {
    if (!drag) return;
    const { dx, active, time } = drag;
    drag = null;
    if (!active) return;
    track.classList.remove('is-dragging');
    suppressClick = true;
    setTimeout(() => { suppressClick = false; }, 0);
    const fast = Math.abs(dx) > 40 && Date.now() - time < 300;
    if (Math.abs(dx) > carousel.clientWidth * 0.2 || fast) step(dx < 0 ? 1 : -1);
    else setTrack(position);   // spring back
  }

  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
  track.addEventListener('click', e => {
    if (suppressClick) { e.preventDefault(); e.stopPropagation(); }
  }, true);
  track.addEventListener('dragstart', e => e.preventDefault());

  // sideways trackpad scroll
  let wheelTotal = 0;
  let wheelLock = false;
  track.addEventListener('wheel', e => {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    e.preventDefault();
    if (wheelLock) return;
    wheelTotal += e.deltaX;
    if (Math.abs(wheelTotal) > 50) {
      step(wheelTotal > 0 ? 1 : -1);
      wheelTotal = 0;
      wheelLock = true;
      setTimeout(() => { wheelLock = false; }, 600);
    }
  }, { passive: false });

  // load the other slides' images shortly before the section comes into view
  new IntersectionObserver((entries, observer) => {
    if (!entries[0].isIntersecting) return;
    track.querySelectorAll('img[loading="lazy"]').forEach(img => { img.loading = 'eager'; });
    observer.disconnect();
  }, { rootMargin: '600px 0px' }).observe(carousel);

  carousel.classList.add('is-ready');
  setTrack(position, 0, false);
  update();
})();
