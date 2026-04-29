/* ============================================================
   DARKSALXM — script.js  (v3)
   Smart embed: Twitch when live · YouTube when offline
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   CONFIG — update these whenever anything changes
───────────────────────────────────────────────────────────── */
const CONFIG = {
  twitch: {
    channel:    'darksalxm',
    parent:     'salxm.com',       // must match domain exactly
    streamDays: [2, 4, 6],         // 0=Sun 1=Mon 2=Tue 3=Wed 4=Thu 5=Fri 6=Sat
    startHour:  19,                // 7 PM CST
    endHour:    23,                // 11 PM CST
    timezone:   'America/Chicago',
  },

  youtube: {
    channelId:  'UCtZV0M-C3hTmMBbbb3X-MhQ',       // ← replace with your real YouTube channel ID
    // Fallback embed if API key not set — just embeds the channel's latest uploads playlist
    // Get your channel ID from: youtube.com > your channel > About > Share > Copy channel ID
    latestVideoId: '',               // leave blank — auto-fetched at runtime when possible
    // Optional: YouTube Data API v3 key for fetching latest video automatically
    // Leave blank to use the channel page embed fallback instead
    apiKey: 'UUtZV0M-C3hTmMBbbb3X-MhQ',
    // Fallback playlist URL — embeds channel's "Uploads" playlist
    // Replace UCxxxxx with your channel ID (replace UC with UU)
    uploadsPlaylistId: '', // ← replace UC with UU in your channel ID
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

  popupDelay:          2800,   // ms before live popup appears
  navScrollThreshold:  30,
};

/* ─────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

function getNowCST() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: CONFIG.twitch.timezone }));
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/* ─────────────────────────────────────────────────────────────
   LIVE DETECTION
   - URL param ?live=1 forces live state (for testing)
   - URL param ?live=0 forces offline state (for testing)
   - Otherwise: checks day-of-week + hour in CST
───────────────────────────────────────────────────────────── */
function isStreamLive() {
  const override = getParam('live');
  if (override === '1') return true;
  if (override === '0') return false;

  const now  = getNowCST();
  const day  = now.getDay();
  const hour = now.getHours();
  return CONFIG.twitch.streamDays.includes(day)
    && hour >= CONFIG.twitch.startHour
    && hour < CONFIG.twitch.endHour;
}

/* ─────────────────────────────────────────────────────────────
   SMART EMBED
   LIVE  → Twitch player (muted autoplay)
   OFFLINE → YouTube latest video or uploads playlist
───────────────────────────────────────────────────────────── */

/** Build Twitch embed URL */
function twitchEmbedURL() {
  return `https://player.twitch.tv/?channel=${CONFIG.twitch.channel}&parent=${CONFIG.twitch.parent}&muted=true&autoplay=true`;
}

/**
 * Build YouTube embed URL.
 * Priority:
 *   1. If a specific video ID was fetched → embed that video
 *   2. If uploads playlist ID is set → embed playlist (shows latest)
 *   3. Fallback: embed channel search page
 */
function youtubeEmbedURL(videoId = '') {
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0&modestbranding=1`;
  }
  if (CONFIG.youtube.uploadsPlaylistId) {
    return `https://www.youtube.com/embed?listType=playlist&list=${CONFIG.youtube.uploadsPlaylistId}&autoplay=0&rel=0&modestbranding=1`;
  }
  // Hard fallback — channel page
  return `https://www.youtube.com/embed?listType=user_uploads&list=darksalxm&rel=0`;
}

/**
 * Try to fetch the latest YouTube video ID via YouTube Data API v3.
 * Only runs if CONFIG.youtube.apiKey is set.
 * Returns a video ID string or empty string.
 */
async function fetchLatestYouTubeVideoId() {
  if (!CONFIG.youtube.apiKey || !CONFIG.youtube.channelId) return '';
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${CONFIG.youtube.apiKey}&channelId=${CONFIG.youtube.channelId}&part=snippet,id&order=date&maxResults=1&type=video`;
    const res  = await fetch(url);
    if (!res.ok) return '';
    const data = await res.json();
    return data?.items?.[0]?.id?.videoId ?? '';
  } catch {
    return '';
  }
}

/** Inject the correct iframe into #stream-embed-container */
async function mountSmartEmbed(isLive) {
  const container   = $('#stream-embed-container');
  const statusDot   = $('#embed-status-dot');
  const statusLabel = $('#embed-status-label');
  const openLink    = $('#embed-open-link');
  if (!container) return;

  // Show loading state
  container.innerHTML = `
    <div class="embed-loading">
      <div class="spin-ring"></div>
      <p>${isLive ? 'CONNECTING TO STREAM…' : 'LOADING LATEST VIDEO…'}</p>
    </div>`;

  let src = '';
  let labelText  = '';
  let linkHref   = '';
  let linkText   = '';

  if (isLive) {
    src       = twitchEmbedURL();
    labelText = '🔴 LIVE ON TWITCH';
    linkHref  = `https://twitch.tv/${CONFIG.twitch.channel}`;
    linkText  = 'OPEN IN TWITCH ↗';
    if (statusDot)   { statusDot.className = 'embed-dot live'; }
    if (statusLabel) { statusLabel.textContent = labelText; }
  } else {
    // Try to get the most recent YouTube video
    const videoId = await fetchLatestYouTubeVideoId();
    src       = youtubeEmbedURL(videoId);
    labelText = 'LATEST VIDEO — YOUTUBE';
    linkHref  = `https://youtube.com/@darksalxm`;
    linkText  = 'OPEN CHANNEL ↗';
    if (statusDot)   { statusDot.className = 'embed-dot offline'; }
    if (statusLabel) { statusLabel.textContent = labelText; }
  }

  if (openLink) {
    openLink.href        = linkHref;
    openLink.textContent = linkText;
  }

  // Build iframe — replace loading overlay
  const iframe = document.createElement('iframe');
  iframe.src             = src;
  iframe.allowFullscreen = true;
  iframe.title           = isLive ? 'DarkSalxm Live Stream' : 'DarkSalxm Latest Video';
  iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');

  iframe.onload = () => {
    container.innerHTML = '';
    container.appendChild(iframe);
  };

  // Safety timeout — show iframe even if onload doesn't fire
  setTimeout(() => {
    if (container.querySelector('.embed-loading')) {
      container.innerHTML = '';
      container.appendChild(iframe);
    }
  }, 4000);
}

/* ─────────────────────────────────────────────────────────────
   APPLY LIVE STATE — updates all UI elements at once
───────────────────────────────────────────────────────────── */
function applyLiveState(isLive) {
  // Nav button
  const navBtn = $('#nav-live-btn');
  if (navBtn) navBtn.classList.toggle('offline', !isLive);

  // Hero avatar dot
  const avatarStatus = $('#hero-status');
  if (avatarStatus) avatarStatus.classList.toggle('offline', !isLive);

  // Hero status text
  const statusText = $('#live-status-text');
  if (statusText) {
    statusText.textContent = isLive ? '● Live Now' : '● Offline';
    statusText.classList.toggle('live', isLive);
  }

  // Smart embed
  mountSmartEmbed(isLive);

  // Live popup
  if (isLive) setTimeout(openLivePopup, CONFIG.popupDelay);

  // Console badge
  console.log(
    `%c DarkSalxm %c ${isLive ? '🔴 LIVE' : '⚫ OFFLINE'} `,
    'background:#08100a;color:#c0281e;font-weight:bold;padding:4px 8px;border-radius:4px 0 0 4px;',
    isLive
      ? 'background:#c0281e;color:#fff;font-weight:bold;padding:4px 8px;border-radius:0 4px 4px 0;'
      : 'background:#2a5c32;color:#fff;font-weight:bold;padding:4px 8px;border-radius:0 4px 4px 0;'
  );
}

/* ─────────────────────────────────────────────────────────────
   LIVE POPUP
───────────────────────────────────────────────────────────── */
function openLivePopup() {
  const popup  = $('#live-popup');
  const iframe = $('#popup-twitch-iframe');
  if (!popup) return;
  if (iframe && !iframe.src) iframe.src = twitchEmbedURL();
  popup.classList.add('visible');
  document.body.style.overflow = 'hidden';
}

function closePopup() {
  const popup = $('#live-popup');
  if (!popup) return;
  popup.classList.remove('visible');
  document.body.style.overflow = '';
}
window.closePopup = closePopup; // global reference for inline onclick

function initPopupEvents() {
  const popup      = $('#live-popup');
  const closeBtn   = $('#popup-close-btn');
  const dismissBtn = $('#popup-dismiss-btn');
  if (!popup) return;
  popup.addEventListener('click',  (e) => { if (e.target === popup) closePopup(); });
  if (closeBtn)   closeBtn.addEventListener('click', closePopup);
  if (dismissBtn) dismissBtn.addEventListener('click', closePopup);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePopup(); });
}

/* ─────────────────────────────────────────────────────────────
   BACKGROUND ART ROTATOR
───────────────────────────────────────────────────────────── */
function initBackground() {
  const bgEl     = $('#bg-art');
  const aboutImg = $('#about-bg-img');
  if (!bgEl) return;

  const chosen  = CONFIG.backgroundImages[Math.floor(Math.random() * CONFIG.backgroundImages.length)];
  const preload = new Image();
  preload.onload = () => {
    bgEl.style.backgroundImage = `url("${chosen}")`;
    bgEl.style.opacity = '1';
    if (aboutImg) aboutImg.src = chosen;
  };
  preload.onerror = () => { bgEl.style.opacity = '1'; };
  preload.src = chosen;
}

/* ─────────────────────────────────────────────────────────────
   SCROLL REVEAL — IntersectionObserver, fires once per element
───────────────────────────────────────────────────────────── */
function initScrollReveal() {
  const targets = $$('.reveal');
  if (!targets.length) return;
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('revealed'); io.unobserve(e.target); }
    }),
    { threshold: 0.10, rootMargin: '0px 0px -32px 0px' }
  );
  targets.forEach((el) => io.observe(el));
}

/* ─────────────────────────────────────────────────────────────
   SCHEDULE — highlight today's column
───────────────────────────────────────────────────────────── */
function initSchedule() {
  const DAY_ABBR = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const today = DAY_ABBR[new Date().getDay()];
  $$('.day-card').forEach((card) => {
    if (card.querySelector('.day-name')?.textContent.trim() === today) {
      card.classList.add('today');
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   NAV — add scrolled class + active link tracking
───────────────────────────────────────────────────────────── */
function initNav() {
  const nav = $('nav');
  if (!nav) return;

  // Scrolled background
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > CONFIG.navScrollThreshold);
  }, { passive: true });

  // Active section highlight
  const sections = $$('section[id]');
  const links    = $$('.nav-links a[href^="#"]');
  if (sections.length && links.length) {
    const sectionIO = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          links.forEach((a) => a.classList.remove('active'));
          const match = links.find((a) => a.getAttribute('href') === `#${e.target.id}`);
          if (match) match.classList.add('active');
        }
      }),
      { threshold: 0.45 }
    );
    sections.forEach((s) => sectionIO.observe(s));
  }
}

/* ─────────────────────────────────────────────────────────────
   SMOOTH SCROLL
───────────────────────────────────────────────────────────── */
function initSmoothScroll() {
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   CLICK-TO-COPY BUSINESS EMAIL
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
    }).catch(() => {
      window.location.href = `mailto:${el.textContent.trim()}`;
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────────── */
function init() {
  initBackground();
  initScrollReveal();
  initSchedule();
  initNav();
  initSmoothScroll();
  initPopupEvents();
  initCopyEmail();
  applyLiveState(isStreamLive());
}

document.readyState === 'loading'
  ? document.addEventListener('DOMContentLoaded', init)
  : init();
