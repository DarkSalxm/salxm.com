/* ============================================================
   DARKSALXM — script.js  (v4)
   ============================================================ */
'use strict';

/* ─────────────────────────────────────────────────────────────
   ████  SCHEDULE DATA  ████
   Edit this to update your schedule ANY time — no HTML needed.
   Just change the game, note, or active flag here and push.
───────────────────────────────────────────────────────────── */
const SCHEDULE = [
  { day: 'Sun',  fullDay: 'Sunday',    stream: true,  icon: '🎮', time: '7–11 PM',  game: 'Variety',         note: 'Chill vibes to end the week' },
  { day: 'Mon',  fullDay: 'Monday',    stream: false, icon: '😴', time: '',          game: '',                note: 'Rest day' },
  { day: 'Tue',  fullDay: 'Tuesday',   stream: true,  icon: '🎮', time: '7–11 PM',  game: 'Variety',         note: 'Anything goes — come find out' },
  { day: 'Wed',  fullDay: 'Wednesday', stream: true,  icon: '🕹️', time: '7–11 PM',  game: 'Variety',         note: 'Mid-week energy check' },
  { day: 'Thu',  fullDay: 'Thursday',  stream: true,  icon: '💬', time: '7–11 PM',  game: 'Just Chatting',   note: 'Talk to me. I dare you.' },
  { day: 'Fri',  fullDay: 'Friday',    stream: true,  icon: '👾', time: '7–11 PM',  game: 'Community Night', note: 'YOU pick the game. Bring chaos.' },
  { day: 'Sat',  fullDay: 'Saturday',  stream: false, icon: '😴', time: '',          game: '',                note: 'Rest day' },
];

/* ─────────────────────────────────────────────────────────────
   ████  CONFIG  ████
───────────────────────────────────────────────────────────── */
const CONFIG = {
  twitch: {
    channel:    'darksalxm',
    parent:     'salxm.com',
    timezone:   'America/Chicago',
    startHour:  19,   // 7 PM CST
    endHour:    23,   // 11 PM CST
  },

  youtube: {
    channelId:        'UCtZV0M-C3hTmMBbbb3X-MhQ',
    uploadsPlaylistId:'UUtZV0M-C3hTmMBbbb3X-MhQ', // UC → UU
    apiKey:           '',   // optional — leave blank, playlist works fine
  },

  backgroundImages: [
    'https://pbs.twimg.com/media/Gdj17DCWsAAV1Bc?format=jpg&name=large',
    'https://pbs.twimg.com/media/Gan_VifWEAAWD78?format=jpg&name=large',
    'https://pbs.twimg.com/media/GZjPt-eWUAINrqR?format=jpg&name=4096x4096',
    'https://pbs.twimg.com/media/GbCKgFiXQAE2eg9?format=jpg&name=large',
    'https://pbs.twimg.com/media/GalG9zoXYAAWpBV?format=jpg&name=900x900',
    'https://pbs.twimg.com/media/Gab6ay_WcAApqTi?format=jpg&name=large',
    'https://pbs.twimg.com/media/GZYPn-VXYAAFhRy?format=jpg&name=large',
  ],

  // Phrases that cycle in the hero tagline typewriter
  typingPhrases: [
    '// THE FAKE VTUBER',
    '// NOT YOUR AVERAGE STREAMER',
    '// CHAOS IS THE CONTENT',
    '// VIEWER COUNT: DOESN\'T MATTER',
    '// SCRIPT.EXE NOT FOUND',
  ],

  popupDelay:         2800,
  navScrollThreshold: 30,
};

/* ─────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────── */
const $  = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

function getNowCST() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: CONFIG.twitch.timezone }));
}
function getParam(n) { return new URLSearchParams(location.search).get(n); }

/* ─────────────────────────────────────────────────────────────
   LIVE DETECTION  (?live=1 to force on, ?live=0 to force off)
───────────────────────────────────────────────────────────── */
function isStreamLive() {
  const ov = getParam('live');
  if (ov === '1') return true;
  if (ov === '0') return false;
  const now  = getNowCST();
  const sched = SCHEDULE[now.getDay()];
  return sched.stream && now.getHours() >= CONFIG.twitch.startHour && now.getHours() < CONFIG.twitch.endHour;
}

/* ─────────────────────────────────────────────────────────────
   SCHEDULE — render from data + highlight today
───────────────────────────────────────────────────────────── */
function renderSchedule() {
  const grid = $('#schedule-grid');
  if (!grid) return;
  const todayIdx = new Date().getDay();

  grid.innerHTML = SCHEDULE.map((s, i) => {
    const isToday  = i === todayIdx;
    const classes  = ['day-card', s.stream ? 'stream-day' : '', isToday ? 'today' : ''].filter(Boolean).join(' ');
    return `
      <div class="${classes}">
        <div class="day-name">${s.day}</div>
        <div class="day-icon">${s.icon}</div>
        ${s.stream
          ? `<div class="day-game">${s.game}</div>
             <div class="day-time">${s.time}</div>`
          : `<div class="off-label">${s.note}</div>`
        }
        ${isToday && s.stream ? `<div class="today-badge">TODAY</div>` : ''}
      </div>`;
  }).join('');

  // Active day expanded card
  const todaySched = SCHEDULE[todayIdx];
  const expanded = $('#schedule-today-card');
  if (expanded) {
    if (todaySched.stream) {
      expanded.innerHTML = `
        <div class="today-card-inner">
          <div class="tc-icon">${todaySched.icon}</div>
          <div class="tc-info">
            <div class="tc-label">// STREAMING TODAY</div>
            <div class="tc-game">${todaySched.game}</div>
            <div class="tc-note">${todaySched.note}</div>
          </div>
          <div class="tc-time">${todaySched.time}<span>CST</span></div>
        </div>`;
      expanded.classList.remove('hidden');
    } else {
      expanded.classList.add('hidden');
    }
  }
}

/* ─────────────────────────────────────────────────────────────
   SMART EMBED — Twitch live · YouTube offline
───────────────────────────────────────────────────────────── */
function twitchURL() {
  return `https://player.twitch.tv/?channel=${CONFIG.twitch.channel}&parent=${CONFIG.twitch.parent}&muted=true&autoplay=true`;
}
function youtubeURL(videoId = '') {
  if (videoId) return `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
  return `https://www.youtube.com/embed?listType=playlist&list=${CONFIG.youtube.uploadsPlaylistId}&rel=0&modestbranding=1`;
}

async function fetchLatestYTVideo() {
  if (!CONFIG.youtube.apiKey || !CONFIG.youtube.channelId) return '';
  try {
    const r = await fetch(`https://www.googleapis.com/youtube/v3/search?key=${CONFIG.youtube.apiKey}&channelId=${CONFIG.youtube.channelId}&part=id&order=date&maxResults=1&type=video`);
    if (!r.ok) return '';
    const d = await r.json();
    return d?.items?.[0]?.id?.videoId ?? '';
  } catch { return ''; }
}

async function mountEmbed(live) {
  const wrap  = $('#stream-embed-container');
  const dot   = $('#embed-status-dot');
  const label = $('#embed-status-label');
  const link  = $('#embed-open-link');
  if (!wrap) return;

  wrap.innerHTML = `<div class="embed-loading"><div class="spin-ring"></div><p>${live ? 'CONNECTING TO STREAM…' : 'LOADING LATEST VIDEO…'}</p></div>`;

  let src, labelTxt, href, linkTxt;

  if (live) {
    src      = twitchURL();
    labelTxt = '🔴  LIVE ON TWITCH';
    href     = `https://twitch.tv/${CONFIG.twitch.channel}`;
    linkTxt  = 'OPEN IN TWITCH ↗';
    if (dot)   dot.className   = 'embed-dot live';
  } else {
    const vid = await fetchLatestYTVideo();
    src      = youtubeURL(vid);
    labelTxt = 'LATEST VIDEO — YOUTUBE';
    href     = 'https://youtube.com/@darksalxm';
    linkTxt  = 'OPEN CHANNEL ↗';
    if (dot)   dot.className   = 'embed-dot offline';
  }

  if (label) label.textContent = labelTxt;
  if (link)  { link.href = href; link.textContent = linkTxt; }

  const iframe = document.createElement('iframe');
  iframe.src             = src;
  iframe.allowFullscreen = true;
  iframe.title           = live ? 'DarkSalxm Live' : 'DarkSalxm Latest Video';
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');

  const inject = () => { wrap.innerHTML = ''; wrap.appendChild(iframe); };
  iframe.onload = inject;
  setTimeout(() => { if (wrap.querySelector('.embed-loading')) inject(); }, 5000);
}

/* ─────────────────────────────────────────────────────────────
   APPLY LIVE STATE
───────────────────────────────────────────────────────────── */
function applyLiveState(live) {
  const navBtn = $('#nav-live-btn');
  if (navBtn) navBtn.classList.toggle('offline', !live);

  const dot = $('#hero-status');
  if (dot)  dot.classList.toggle('offline', !live);

  const txt = $('#live-status-text');
  if (txt)  { txt.textContent = live ? '● Live Now' : '● Offline'; txt.classList.toggle('live', live); }

  mountEmbed(live);
  if (live) setTimeout(openLivePopup, CONFIG.popupDelay);

  console.log(
    `%c DarkSalxm %c ${live ? '🔴 LIVE' : '⚫ OFFLINE'} `,
    'background:#08100a;color:#c0281e;font-weight:bold;padding:4px 8px;border-radius:4px 0 0 4px;',
    live ? 'background:#c0281e;color:#fff;font-weight:bold;padding:4px 8px;border-radius:0 4px 4px 0;'
         : 'background:#2a5c32;color:#fff;font-weight:bold;padding:4px 8px;border-radius:0 4px 4px 0;'
  );
}

/* ─────────────────────────────────────────────────────────────
   POPUP
───────────────────────────────────────────────────────────── */
function openLivePopup() {
  const popup = $('#live-popup');
  if (!popup) return;
  const f = $('#popup-twitch-iframe');
  if (f && !f.src) f.src = twitchURL();
  popup.classList.add('visible');
  document.body.style.overflow = 'hidden';
}
function closePopup() {
  const popup = $('#live-popup');
  if (!popup) return;
  popup.classList.remove('visible');
  document.body.style.overflow = '';
}
window.closePopup = closePopup;

function initPopupEvents() {
  const popup = $('#live-popup');
  if (!popup) return;
  popup.addEventListener('click', e => { if (e.target === popup) closePopup(); });
  $('#popup-close-btn')  ?.addEventListener('click', closePopup);
  $('#popup-dismiss-btn')?.addEventListener('click', closePopup);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopup(); });
}

/* ─────────────────────────────────────────────────────────────
   TYPEWRITER EFFECT — hero tagline cycles phrases
───────────────────────────────────────────────────────────── */
function initTypewriter() {
  const el = $('#hero-tagline');
  if (!el) return;

  const phrases = CONFIG.typingPhrases;
  let pIdx = 0, cIdx = 0, deleting = false;

  function tick() {
    const phrase = phrases[pIdx];
    if (!deleting) {
      cIdx++;
      el.textContent = phrase.slice(0, cIdx);
      if (cIdx === phrase.length) {
        deleting = true;
        setTimeout(tick, 2200); // pause at full phrase
        return;
      }
      setTimeout(tick, 68);
    } else {
      cIdx--;
      el.textContent = phrase.slice(0, cIdx);
      if (cIdx === 0) {
        deleting = false;
        pIdx = (pIdx + 1) % phrases.length;
        setTimeout(tick, 400);
        return;
      }
      setTimeout(tick, 34);
    }
  }
  tick();
}

/* ─────────────────────────────────────────────────────────────
   ANIMATED STAT COUNTERS — count up on scroll into view
───────────────────────────────────────────────────────────── */
function initCounters() {
  const counters = $$('[data-count]');
  if (!counters.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el      = entry.target;
      const target  = parseFloat(el.dataset.count);
      const suffix  = el.dataset.suffix ?? '';
      const prefix  = el.dataset.prefix ?? '';
      const isFloat = el.dataset.float === 'true';
      const dur     = 1400;
      const start   = performance.now();

      function step(now) {
        const p   = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3); // ease-out cubic
        const val  = target * ease;
        el.textContent = prefix + (isFloat ? val.toFixed(1) : Math.floor(val)) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
      io.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach(el => io.observe(el));
}

/* ─────────────────────────────────────────────────────────────
   MARQUEE STRIP — auto-scrolling banner of platform chips
───────────────────────────────────────────────────────────── */
function initMarquee() {
  const track = $('#marquee-track');
  if (!track) return;
  // Duplicate content for seamless loop
  track.innerHTML += track.innerHTML;
}

/* ─────────────────────────────────────────────────────────────
   CURSOR GLOW — soft radial that follows mouse
───────────────────────────────────────────────────────────── */
function initCursorGlow() {
  // Don't run on touch devices
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const glow = document.createElement('div');
  glow.id = 'cursor-glow';
  document.body.appendChild(glow);

  let mx = -999, my = -999;
  document.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; }, { passive: true });

  let rafId;
  let cx = -999, cy = -999;
  function animate() {
    cx += (mx - cx) * 0.08;
    cy += (my - cy) * 0.08;
    glow.style.transform = `translate(${cx}px, ${cy}px)`;
    rafId = requestAnimationFrame(animate);
  }
  animate();
}

/* ─────────────────────────────────────────────────────────────
   BACKGROUND
───────────────────────────────────────────────────────────── */
function initBackground() {
  const bgEl     = $('#bg-art');
  const aboutImg = $('#about-bg-img');
  const heroImg  = $('#hero-art-img');
  if (!bgEl) return;

  const chosen  = CONFIG.backgroundImages[Math.floor(Math.random() * CONFIG.backgroundImages.length)];
  const preload = new Image();
  preload.onload = () => {
    bgEl.style.backgroundImage = `url("${chosen}")`;
    bgEl.style.opacity = '1';
    if (aboutImg) aboutImg.src = chosen;
    if (heroImg)  heroImg.src  = chosen;
  };
  preload.onerror = () => { bgEl.style.opacity = '1'; };
  preload.src = chosen;
}

/* ─────────────────────────────────────────────────────────────
   SCROLL REVEAL
───────────────────────────────────────────────────────────── */
function initScrollReveal() {
  const els = $$('.reveal');
  if (!els.length) return;
  const io = new IntersectionObserver(
    entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); } }),
    { threshold: 0.08, rootMargin: '0px 0px -28px 0px' }
  );
  els.forEach(el => io.observe(el));
}

/* ─────────────────────────────────────────────────────────────
   NAV
───────────────────────────────────────────────────────────── */
function initNav() {
  const nav = $('nav');
  if (!nav) return;
  window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > CONFIG.navScrollThreshold), { passive: true });

  const sections = $$('section[id]');
  const links    = $$('.nav-links a[href^="#"]');
  if (sections.length && links.length) {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(a => a.classList.remove('active'));
          links.find(a => a.getAttribute('href') === `#${e.target.id}`)?.classList.add('active');
        }
      }),
      { threshold: 0.40 }
    );
    sections.forEach(s => io.observe(s));
  }
}

/* ─────────────────────────────────────────────────────────────
   SMOOTH SCROLL
───────────────────────────────────────────────────────────── */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   COPY EMAIL
───────────────────────────────────────────────────────────── */
function initCopyEmail() {
  const el = $('#contact-email');
  if (!el) return;
  el.title = 'Click to copy';
  el.addEventListener('click', () => {
    navigator.clipboard.writeText(el.textContent.trim()).then(() => {
      const orig = el.textContent;
      el.textContent = 'Copied!';
      el.style.color = 'var(--green-lit)';
      setTimeout(() => { el.textContent = orig; el.style.color = ''; }, 1800);
    }).catch(() => { location.href = `mailto:${el.textContent.trim()}`; });
  });
}

/* ─────────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────────── */
function init() {
  initBackground();
  renderSchedule();
  initScrollReveal();
  initNav();
  initSmoothScroll();
  initPopupEvents();
  initCopyEmail();
  initTypewriter();
  initCounters();
  initMarquee();
  initCursorGlow();
  applyLiveState(isStreamLive());
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
