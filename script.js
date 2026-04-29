/* ============================================================
   DARKSALXM — script.js
   ============================================================ */

'use strict';

/* ─────────────────────────────────────────────────────────────
   CONFIG — edit these if anything changes
───────────────────────────────────────────────────────────── */
const CONFIG = {
  twitch: {
    channel:    'darksalxm',
    parent:     'salxm.com',             // must match your domain
    streamDays: [2, 4, 6],              // Tue=2, Thu=4, Sat=6
    startHour:  19,                     // 7 PM CST
    endHour:    23,                     // 11 PM CST
    timezone:   'America/Chicago',      // CST timezone
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
  popupDelay: 2500,   // ms before live popup appears
  navScrollThreshold: 30,
};

/* ─────────────────────────────────────────────────────────────
   UTILS
───────────────────────────────────────────────────────────── */

/** Get the current time in a given IANA timezone */
function getNowInTimezone(timezone) {
  return new Date(new Date().toLocaleString('en-US', { timeZone: timezone }));
}

/** Get URL param value (e.g. ?live=1) */
function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/** Select one element, throws a console warning if missing */
function $(selector, context = document) {
  const el = context.querySelector(selector);
  if (!el) console.warn(`[DarkSalxm] Element not found: ${selector}`);
  return el;
}

/** Select all elements */
function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

/* ─────────────────────────────────────────────────────────────
   LIVE STATUS DETECTION
   Strategy: time-based (matching the original site's approach).
   To force "live" during testing, append ?live=1 to the URL.
   To force "offline", append ?live=0.
───────────────────────────────────────────────────────────── */
function isStreamLive() {
  // Manual override via URL param
  const override = getParam('live');
  if (override === '1') return true;
  if (override === '0') return false;

  // Time-based detection
  const now  = getNowInTimezone(CONFIG.twitch.timezone);
  const day  = now.getDay();
  const hour = now.getHours();

  const isStreamDay  = CONFIG.twitch.streamDays.includes(day);
  const isStreamTime = hour >= CONFIG.twitch.startHour && hour < CONFIG.twitch.endHour;

  return isStreamDay && isStreamTime;
}

/* ─────────────────────────────────────────────────────────────
   BACKGROUND ART ROTATOR
   Picks a random image from the list, fades it in once loaded.
   Also updates the About section img for visual cohesion.
───────────────────────────────────────────────────────────── */
function initBackground() {
  const bgEl     = $('#bg-art');
  const aboutImg = $('#about-bg-img');
  if (!bgEl) return;

  const images = CONFIG.backgroundImages;
  const chosen = images[Math.floor(Math.random() * images.length)];

  const preload  = new Image();
  preload.onload = () => {
    bgEl.style.backgroundImage = `url("${chosen}")`;
    bgEl.style.opacity = '1';
    if (aboutImg) aboutImg.src = chosen;
  };
  preload.onerror = () => {
    // If the image fails, just fade in with no bg
    bgEl.style.opacity = '1';
  };
  preload.src = chosen;
}

/* ─────────────────────────────────────────────────────────────
   LIVE UI — update all live-state elements
───────────────────────────────────────────────────────────── */
function applyLiveState(live) {
  /* -- Nav button -- */
  const navBtn = $('#nav-live-btn');
  if (navBtn) {
    navBtn.classList.toggle('offline', !live);
  }

  /* -- Hero avatar status dot -- */
  const avatarStatus = $('#hero-status');
  if (avatarStatus) {
    avatarStatus.classList.toggle('offline', !live);
  }

  /* -- Hero status text -- */
  const statusText = $('#live-status-text');
  if (statusText) {
    if (live) {
      statusText.textContent = '● Live Now';
      statusText.classList.add('live');
    } else {
      statusText.textContent = '● Offline';
      statusText.classList.remove('live');
    }
  }

  /* -- Stream section: show embed or offline placeholder -- */
  const twitchPlayer = $('#twitch-player');
  const offlineMsg   = $('#stream-offline-msg');
  if (twitchPlayer && offlineMsg) {
    if (live) {
      twitchPlayer.style.display = 'block';
      offlineMsg.style.display   = 'none';
      // Lazy-load the iframe src (avoids loading Twitch when offline)
      if (!twitchPlayer.src) {
        twitchPlayer.src = buildTwitchEmbedURL();
      }
    } else {
      twitchPlayer.style.display = 'none';
      offlineMsg.style.display   = 'flex';
    }
  }

  /* -- Show live popup after delay if live -- */
  if (live) {
    setTimeout(openLivePopup, CONFIG.popupDelay);
  }
}

function buildTwitchEmbedURL() {
  return `https://player.twitch.tv/?channel=${CONFIG.twitch.channel}&parent=${CONFIG.twitch.parent}&muted=true`;
}

/* ─────────────────────────────────────────────────────────────
   LIVE POPUP
───────────────────────────────────────────────────────────── */
function openLivePopup() {
  const popup = $('#live-popup');
  if (!popup) return;

  // Lazy-inject the popup embed src
  const iframe = $('#popup-twitch-iframe');
  if (iframe && !iframe.src) {
    iframe.src = buildTwitchEmbedURL();
  }

  popup.classList.add('visible');
  document.body.style.overflow = 'hidden'; // prevent scroll behind popup
}

function closePopup() {
  const popup = $('#live-popup');
  if (!popup) return;
  popup.classList.remove('visible');
  document.body.style.overflow = '';
}

function initPopupEvents() {
  const popup     = $('#live-popup');
  const closeBtn  = $('#popup-close-btn');
  const dismissBtn = $('#popup-dismiss-btn');

  if (!popup) return;

  // Close on backdrop click
  popup.addEventListener('click', (e) => {
    if (e.target === popup) closePopup();
  });

  // Close button (X)
  if (closeBtn) closeBtn.addEventListener('click', closePopup);

  // Dismiss button
  if (dismissBtn) dismissBtn.addEventListener('click', closePopup);

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePopup();
  });
}

/* Make closePopup available globally (called from inline HTML if needed) */
window.closePopup = closePopup;

/* ─────────────────────────────────────────────────────────────
   SCROLL REVEAL
   Uses IntersectionObserver — no layout thrash, no jQuery.
───────────────────────────────────────────────────────────── */
function initScrollReveal() {
  const targets = $$('.reveal');
  if (!targets.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target); // fire once
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}

/* ─────────────────────────────────────────────────────────────
   SCHEDULE — highlight today's card
───────────────────────────────────────────────────────────── */
function initSchedule() {
  const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const todayName = DAY_NAMES[new Date().getDay()];

  $$('.day-card').forEach((card) => {
    const label = card.querySelector('.day-name');
    if (label && label.textContent.trim() === todayName) {
      card.classList.add('today');
    }
  });
}

/* ─────────────────────────────────────────────────────────────
   NAV — add .scrolled class after threshold
───────────────────────────────────────────────────────────── */
function initNavScroll() {
  const nav = $('nav');
  if (!nav) return;

  const onScroll = () => {
    nav.classList.toggle('scrolled', window.scrollY > CONFIG.navScrollThreshold);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
}

/* ─────────────────────────────────────────────────────────────
   SMOOTH SCROLL for nav anchor links
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
   ACTIVE NAV LINK — highlights link matching visible section
───────────────────────────────────────────────────────────── */
function initActiveNav() {
  const sections = $$('section[id]');
  const links    = $$('.nav-links a[href^="#"]');
  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          links.forEach((a) => a.classList.remove('active'));
          const active = links.find((a) => a.getAttribute('href') === `#${entry.target.id}`);
          if (active) active.classList.add('active');
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach((sec) => observer.observe(sec));
}

/* ─────────────────────────────────────────────────────────────
   BACKGROUND ROTATOR — change bg every N seconds
   (optional: set interval to 0 to disable)
───────────────────────────────────────────────────────────── */
const BG_ROTATION_INTERVAL = 0; // ms — set to e.g. 30000 for 30s rotation

function initBackgroundRotation() {
  if (!BG_ROTATION_INTERVAL) return;

  const bgEl  = $('#bg-art');
  const images = CONFIG.backgroundImages;
  if (!bgEl) return;

  let current = 0;

  setInterval(() => {
    current = (current + 1) % images.length;
    const next = new Image();
    next.onload = () => {
      bgEl.style.opacity = '0';
      setTimeout(() => {
        bgEl.style.backgroundImage = `url("${images[current]}")`;
        bgEl.style.opacity = '1';
      }, 600);
    };
    next.src = images[current];
  }, BG_ROTATION_INTERVAL);
}

/* ─────────────────────────────────────────────────────────────
   COPY EMAIL — click to copy business email
───────────────────────────────────────────────────────────── */
function initCopyEmail() {
  const emailEl = $('#contact-email');
  if (!emailEl) return;

  emailEl.style.cursor = 'pointer';
  emailEl.title = 'Click to copy';

  emailEl.addEventListener('click', () => {
    const email = emailEl.textContent.trim();
    navigator.clipboard.writeText(email).then(() => {
      const original = emailEl.textContent;
      emailEl.textContent = 'Copied!';
      emailEl.style.color = 'var(--accent3)';
      setTimeout(() => {
        emailEl.textContent = original;
        emailEl.style.color = '';
      }, 1800);
    }).catch(() => {
      // Fallback for browsers without clipboard API
      window.location.href = `mailto:${email}`;
    });
  });
}

/* ─────────────────────────────────────────────────────────────
   PAGE VISIBILITY — pause/resume background grain animation
   (minor perf improvement when tab is hidden)
───────────────────────────────────────────────────────────── */
function initVisibilityOptimization() {
  document.addEventListener('visibilitychange', () => {
    // Grain runs via body::after CSS animation
    document.body.style.animationPlayState =
      document.hidden ? 'paused' : 'running';
  });
}

/* ─────────────────────────────────────────────────────────────
   INIT — runs when DOM is ready
───────────────────────────────────────────────────────────── */
function init() {
  initBackground();
  initBackgroundRotation();
  initScrollReveal();
  initSchedule();
  initNavScroll();
  initSmoothScroll();
  initActiveNav();
  initPopupEvents();
  initCopyEmail();
  initVisibilityOptimization();

  // Apply live/offline state to all UI elements
  const live = isStreamLive();
  applyLiveState(live);

  console.log(
    `%c DarkSalxm %c ${live ? '🔴 LIVE' : '⚫ OFFLINE'} `,
    'background:#06070d; color:#a050ff; font-weight:bold; padding:4px 8px; border-radius:4px 0 0 4px;',
    live
      ? 'background:#ff4040; color:#fff; font-weight:bold; padding:4px 8px; border-radius:0 4px 4px 0;'
      : 'background:#3e4460; color:#eceef8; font-weight:bold; padding:4px 8px; border-radius:0 4px 4px 0;'
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init(); // already loaded
}
