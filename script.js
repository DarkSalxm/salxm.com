/* ============================================================
   DARKSALXM — script.js  v6 PRIORITY UPDATE
   ============================================================ */
   'use strict';

   /* ═══════════════════════════════════════════════════════════
      SCHEDULE
      To update: change game / note here, push to GitHub. Done.
   ═══════════════════════════════════════════════════════════ */
   const SCHEDULE = [
     { day:'Sun', stream:true,  icon:'🎮', time:'7–11 PM', game:'Variety',         note:'Chill chaos to close the week' },
     { day:'Mon', stream:false, icon:'💤', time:'',         game:'',                note:'Rest day' },
     { day:'Tue', stream:true,  icon:'🎮', time:'7–11 PM', game:'Variety',         note:'Anything goes, come find out' },
     { day:'Wed', stream:true,  icon:'🕹️', time:'7–11 PM', game:'Variety',         note:'Mid-week energy check' },
     { day:'Thu', stream:true,  icon:'💬', time:'7–11 PM', game:'Just Chatting',   note:'Talk to me. I dare you.' },
     { day:'Fri', stream:true,  icon:'👾', time:'7–11 PM', game:'Community Night', note:'YOU pick the game. Bring chaos.' },
     { day:'Sat', stream:false, icon:'💤', time:'',         game:'',                note:'Rest day' },
   ];
   
   /* ═══════════════════════════════════════════════════════════
      CONFIG
   ═══════════════════════════════════════════════════════════ */
   const CONFIG = {
     twitch: {
       channel:   'darksalxm',
       parent:    'salxm.com',
       timezone:  'America/Chicago',
       startHour: 19,
       endHour:   23,
     },
     youtube: {
       channelId:        'UCtZV0M-C3hTmMBbbb3X-MhQ',
       uploadsPlaylist:  'UUtZV0M-C3hTmMBbbb3X-MhQ',
       apiKey:           '',
     },
     bgImages: [
       'https://pbs.twimg.com/media/Gdj17DCWsAAV1Bc?format=jpg&name=large',
       'https://pbs.twimg.com/media/Gan_VifWEAAWD78?format=jpg&name=large',
       'https://pbs.twimg.com/media/GZjPt-eWUAINrqR?format=jpg&name=4096x4096',
       'https://pbs.twimg.com/media/GbCKgFiXQAE2eg9?format=jpg&name=large',
       'https://pbs.twimg.com/media/GalG9zoXYAAWpBV?format=jpg&name=900x900',
       'https://pbs.twimg.com/media/Gab6ay_WcAApqTi?format=jpg&name=large',
       'https://pbs.twimg.com/media/GZYPn-VXYAAFhRy?format=jpg&name=large',
     ],
     typingPhrases: [
       'THE FAKE VTUBER. REAL CHAOS.',
       'NOT YOUR AVERAGE STREAMER.',
       'CHAOS IS THE CONTENT.',
       'SCRIPT.EXE NOT FOUND.',
       'WHERE VTUBER MEETS IRL INSANITY.',
     ],
   
     // Changed from 3000 to 9000 so the live popup feels less aggressive.
     popupDelay: 9000,
   };
   
   /* ═══════════════════════════════════════════════════════════
      UTILS
   ═══════════════════════════════════════════════════════════ */
   const $  = (s, c = document) => c.querySelector(s);
   const $$ = (s, c = document) => [...c.querySelectorAll(s)];
   
   const getNowCST = () => new Date(
     new Date().toLocaleString('en-US', { timeZone: CONFIG.twitch.timezone })
   );
   
   const getParam = n => new URLSearchParams(location.search).get(n);
   
   /* ═══════════════════════════════════════════════════════════
      LIVE DETECTION
      This is schedule-based unless you manually use ?live=1 or ?live=0.
   ═══════════════════════════════════════════════════════════ */
   function isLive() {
     const override = getParam('live');
   
     if (override === '1') return true;
     if (override === '0') return false;
   
     const now = getNowCST();
     const sched = SCHEDULE[now.getDay()];
   
     return sched.stream &&
       now.getHours() >= CONFIG.twitch.startHour &&
       now.getHours() < CONFIG.twitch.endHour;
   }
   
   /* ═══════════════════════════════════════════════════════════
      BACKGROUND
   ═══════════════════════════════════════════════════════════ */
   function initBackground() {
     const el = $('#bg-art');
     if (!el) return;
   
     const src = CONFIG.bgImages[Math.floor(Math.random() * CONFIG.bgImages.length)];
     const img = new Image();
   
     img.onload = () => {
       el.style.backgroundImage = `url("${src}")`;
       el.style.opacity = '1';
     };
   
     img.onerror = () => {
       el.style.opacity = '1';
     };
   
     img.src = src;
   }
   
   /* ═══════════════════════════════════════════════════════════
      LIVE STATE
   ═══════════════════════════════════════════════════════════ */
   function applyLiveState(live) {
     const pill = $('#nav-live-pill');
   
     if (pill) {
       pill.classList.toggle('hidden', !live);
     }
   
     const badge = $('#hero-live-badge');
   
     if (badge) {
       badge.className = live ? 'hero-status-badge live' : 'hero-status-badge offline';
   
       const badgeText = badge.querySelector('.badge-text');
       if (badgeText) {
         badgeText.textContent = live ? 'LIVE NOW' : 'USUALLY LIVE 7 PM CST';
       }
     }
   
     const primaryCta = $('#hero-primary-cta');
   
     if (primaryCta && live) {
       primaryCta.innerHTML = '<i class="fab fa-twitch"></i> Watch Live Now';
       primaryCta.classList.add('pulsing');
     }
   
     mountEmbed(live);
   
     // Safer popup behavior:
     // Does not auto-open on mobile or for people who prefer reduced motion.
     const canShowPopup =
       !matchMedia('(max-width:700px)').matches &&
       !matchMedia('(prefers-reduced-motion: reduce)').matches;
   
     if (live && canShowPopup) {
       setTimeout(openPopup, CONFIG.popupDelay);
     }
   
     console.log(
       `%cDarkSalxm%c ${live ? '🔴 LIVE' : '⚫ OFFLINE'}`,
       'background:#c0281e;color:#fff;font-weight:700;padding:3px 8px;border-radius:3px 0 0 3px;',
       'background:#111411;color:#b8bcb8;padding:3px 8px;border-radius:0 3px 3px 0;'
     );
   }
   
   /* ═══════════════════════════════════════════════════════════
      SMART EMBED
   ═══════════════════════════════════════════════════════════ */
   function twitchEmbedSrc() {
     return `https://player.twitch.tv/?channel=${CONFIG.twitch.channel}&parent=${CONFIG.twitch.parent}&muted=true&autoplay=true`;
   }
   
   function youtubeEmbedSrc(videoId = '') {
     const base = 'https://www.youtube-nocookie.com/embed';
   
     if (videoId) {
       return `${base}/${videoId}?rel=0&modestbranding=1&color=red`;
     }
   
     return `${base}?list=${CONFIG.youtube.uploadsPlaylist}&listType=playlist&rel=0&modestbranding=1&color=red`;
   }
   
   async function fetchLatestVideo() {
     if (!CONFIG.youtube.apiKey) return '';
   
     try {
       const r = await fetch(
         `https://www.googleapis.com/youtube/v3/search?key=${CONFIG.youtube.apiKey}` +
         `&channelId=${CONFIG.youtube.channelId}&part=id&order=date&maxResults=1&type=video`
       );
   
       if (!r.ok) return '';
   
       const d = await r.json();
       return d?.items?.[0]?.id?.videoId ?? '';
     } catch {
       return '';
     }
   }
   
   async function mountEmbed(live) {
     const container = $('#embed-container');
     const dot       = $('#embed-dot');
     const label     = $('#embed-label');
     const extLink   = $('#embed-ext-link');
   
     if (!container) return;
   
     container.innerHTML = `
       <div class="embed-spinner">
         <div class="spinner-ring"></div>
         <p>${live ? 'Connecting to stream…' : 'Loading latest video…'}</p>
       </div>
     `;
   
     let src;
     let labelText;
     let href;
   
     if (live) {
       src = twitchEmbedSrc();
       labelText = 'LIVE ON TWITCH';
       href = `https://twitch.tv/${CONFIG.twitch.channel}`;
   
       if (dot) {
         dot.className = 'embed-dot live';
       }
     } else {
       const vid = await fetchLatestVideo();
   
       src = youtubeEmbedSrc(vid);
       labelText = 'LATEST VIDEO, YOUTUBE';
       href = 'https://youtube.com/@darksalxm';
   
       if (dot) {
         dot.className = 'embed-dot vod';
       }
     }
   
     if (label) {
       label.textContent = labelText;
     }
   
     if (extLink) {
       extLink.href = href;
       extLink.textContent = live ? 'OPEN TWITCH ↗' : 'OPEN YOUTUBE ↗';
     }
   
     const iframe = document.createElement('iframe');
   
     iframe.src = src;
     iframe.allowFullscreen = true;
     iframe.title = live ? 'DarkSalxm Live on Twitch' : 'DarkSalxm, Latest Video';
     iframe.setAttribute('allow', 'autoplay; fullscreen; picture-in-picture');
     iframe.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:none;';
   
     iframe.onload = () => {
       container.innerHTML = '';
       container.appendChild(iframe);
     };
   
     setTimeout(() => {
       if (container.querySelector('.embed-spinner')) {
         container.innerHTML = '';
         container.appendChild(iframe);
       }
     }, 4500);
   }
   
   /* ═══════════════════════════════════════════════════════════
      POPUP
   ═══════════════════════════════════════════════════════════ */
   function openPopup() {
     const popup = $('#live-popup');
     if (!popup) return;
   
     const iframe = $('#popup-iframe');
   
     if (iframe && !iframe.src) {
       iframe.src = twitchEmbedSrc();
     }
   
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
   
   function initPopup() {
     const popup = $('#live-popup');
     if (!popup) return;
   
     popup.addEventListener('click', e => {
       if (e.target === popup) closePopup();
     });
   
     $('#popup-close')?.addEventListener('click', closePopup);
     $('#popup-dismiss')?.addEventListener('click', closePopup);
   
     document.addEventListener('keydown', e => {
       if (e.key === 'Escape') closePopup();
     });
   }
   
   /* ═══════════════════════════════════════════════════════════
      SCHEDULE
   ═══════════════════════════════════════════════════════════ */
   function renderSchedule() {
     const grid = $('#schedule-grid');
     if (!grid) return;
   
     const todayIdx = new Date().getDay();
   
     grid.innerHTML = SCHEDULE.map((s, i) => {
       const today = i === todayIdx;
       const classes = ['sched-card', s.stream && 'stream-day', today && 'today']
         .filter(Boolean)
         .join(' ');
   
       return `
         <div class="${classes}">
           ${today && s.stream ? '<div class="sched-today-dot"></div>' : ''}
           <div class="sched-day">${s.day}</div>
           <div class="sched-icon">${s.icon}</div>
           ${s.stream
             ? `<div class="sched-game">${s.game}</div><div class="sched-time">${s.time}</div>`
             : `<div class="sched-off">Off</div>`}
         </div>
       `;
     }).join('');
   
     const card = $('#today-card');
     const today = SCHEDULE[todayIdx];
   
     if (!card) return;
   
     if (today.stream) {
       card.classList.remove('hidden');
   
       card.innerHTML = `
         <div class="tc-wrap">
           <div class="tc-icon">${today.icon}</div>
   
           <div class="tc-body">
             <div class="tc-eyebrow">STREAMING TODAY · ${today.time} CST</div>
             <div class="tc-game">${today.game}</div>
             <div class="tc-note">${today.note}</div>
           </div>
   
           <a href="https://twitch.tv/darksalxm" target="_blank" rel="noopener" class="tc-btn">
             <i class="fab fa-twitch"></i> Watch
           </a>
         </div>
       `;
     } else {
       card.classList.add('hidden');
     }
   }
   
   /* ═══════════════════════════════════════════════════════════
      TYPEWRITER
   ═══════════════════════════════════════════════════════════ */
   function initTypewriter() {
     const el = $('#typewriter');
     if (!el) return;
   
     const phrases = CONFIG.typingPhrases;
     let p = 0;
     let c = 0;
     let deleting = false;
   
     function tick() {
       const phrase = phrases[p];
   
       if (!deleting) {
         el.textContent = phrase.slice(0, ++c);
   
         if (c === phrase.length) {
           deleting = true;
           setTimeout(tick, 2400);
           return;
         }
   
         setTimeout(tick, 55);
       } else {
         el.textContent = phrase.slice(0, --c);
   
         if (c === 0) {
           deleting = false;
           p = (p + 1) % phrases.length;
           setTimeout(tick, 350);
           return;
         }
   
         setTimeout(tick, 28);
       }
     }
   
     tick();
   }
   
   /* ═══════════════════════════════════════════════════════════
      COUNTER ANIMATION
   ═══════════════════════════════════════════════════════════ */
   function initCounters() {
     const io = new IntersectionObserver(entries => {
       entries.forEach(e => {
         if (!e.isIntersecting) return;
   
         const el = e.target;
         const target = parseFloat(el.dataset.count);
         const suffix = el.dataset.suffix ?? '';
         const duration = 1600;
         const start = performance.now();
   
         const run = now => {
           const t = Math.min((now - start) / duration, 1);
           const v = target * (1 - Math.pow(1 - t, 3));
   
           el.textContent = Math.floor(v) + suffix;
   
           if (t < 1) {
             requestAnimationFrame(run);
           }
         };
   
         requestAnimationFrame(run);
         io.unobserve(el);
       });
     }, { threshold: 0.5 });
   
     $$('[data-count]').forEach(el => io.observe(el));
   }
   
   /* ═══════════════════════════════════════════════════════════
      MARQUEE
   ═══════════════════════════════════════════════════════════ */
   function initMarquee() {
     const t = $('#marquee-track');
   
     if (t) {
       t.innerHTML += t.innerHTML;
     }
   }
   
   /* ═══════════════════════════════════════════════════════════
      CURSOR GLOW
   ═══════════════════════════════════════════════════════════ */
   function initCursorGlow() {
     if (matchMedia('(pointer:coarse)').matches) return;
   
     const g = Object.assign(document.createElement('div'), { id: 'cursor-glow' });
     document.body.appendChild(g);
   
     let mx = -999;
     let my = -999;
     let cx = -999;
     let cy = -999;
   
     document.addEventListener('mousemove', e => {
       mx = e.clientX;
       my = e.clientY;
     }, { passive: true });
   
     (function frame() {
       cx += (mx - cx) * 0.07;
       cy += (my - cy) * 0.07;
   
       g.style.transform = `translate(${cx}px, ${cy}px)`;
   
       requestAnimationFrame(frame);
     })();
   }
   
   /* ═══════════════════════════════════════════════════════════
      SCROLL REVEAL
   ═══════════════════════════════════════════════════════════ */
   function initReveal() {
     const io = new IntersectionObserver(
       entries => entries.forEach(e => {
         if (e.isIntersecting) {
           e.target.classList.add('revealed');
           io.unobserve(e.target);
         }
       }),
       { threshold: 0.07, rootMargin: '0px 0px -24px 0px' }
     );
   
     $$('.reveal').forEach(el => io.observe(el));
   }
   
   /* ═══════════════════════════════════════════════════════════
      NAV
   ═══════════════════════════════════════════════════════════ */
   function initNav() {
     const nav = $('nav');
     if (!nav) return;
   
     let ticking = false;
   
     window.addEventListener('scroll', () => {
       if (!ticking) {
         requestAnimationFrame(() => {
           nav.classList.toggle('scrolled', scrollY > 30);
           ticking = false;
         });
   
         ticking = true;
       }
     }, { passive: true });
   
     const links = $$('.nav-links a[href^="#"]');
   
     const io = new IntersectionObserver(
       entries => entries.forEach(e => {
         if (e.isIntersecting) {
           links.forEach(a => a.classList.remove('active'));
   
           links
             .find(a => a.getAttribute('href') === `#${e.target.id}`)
             ?.classList.add('active');
         }
       }),
       { threshold: 0.35 }
     );
   
     $$('section[id]').forEach(s => io.observe(s));
   
     const toggle = $('#mobile-menu-btn');
     const mobileNav = $('#mobile-nav');
   
     if (toggle && mobileNav) {
       toggle.addEventListener('click', () => {
         mobileNav.classList.toggle('open');
         toggle.classList.toggle('open');
       });
   
       $$('#mobile-nav a').forEach(a => a.addEventListener('click', () => {
         mobileNav.classList.remove('open');
         toggle.classList.remove('open');
       }));
     }
   }
   
   /* ═══════════════════════════════════════════════════════════
      SMOOTH SCROLL
   ═══════════════════════════════════════════════════════════ */
   function initScroll() {
     $$('a[href^="#"]').forEach(a => {
       a.addEventListener('click', e => {
         const id = a.getAttribute('href');
   
         if (id === '#') return;
   
         const t = document.querySelector(id);
         if (!t) return;
   
         e.preventDefault();
   
         t.scrollIntoView({
           behavior: 'smooth',
           block: 'start',
         });
       });
     });
   }
   
   /* ═══════════════════════════════════════════════════════════
      COPY EMAIL
   ═══════════════════════════════════════════════════════════ */
   function initEmail() {
     $$('.copy-email').forEach(el => {
       el.addEventListener('click', () => {
         navigator.clipboard.writeText(el.dataset.email || el.textContent.trim())
           .then(() => {
             const original = el.textContent;
   
             el.textContent = 'Copied!';
             el.style.color = 'var(--green-lit)';
   
             setTimeout(() => {
               el.textContent = original;
               el.style.color = '';
             }, 1800);
           })
           .catch(() => {
             location.href = `mailto:${el.dataset.email || el.textContent.trim()}`;
           });
       });
     });
   }
   
   /* ═══════════════════════════════════════════════════════════
      MOBILE STICKY
   ═══════════════════════════════════════════════════════════ */
   function initMobileSticky() {
     const sticky = $('#mobile-sticky');
     if (!sticky) return;
   
     const hero = $('#hero');
   
     const io = new IntersectionObserver(
       entries => sticky.classList.toggle('visible', !entries[0].isIntersecting),
       { threshold: 0 }
     );
   
     if (hero) {
       io.observe(hero);
     }
   }
   
   /* ═══════════════════════════════════════════════════════════
      INIT
   ═══════════════════════════════════════════════════════════ */
   function init() {
     initBackground();
     initReveal();
     initNav();
     initScroll();
     initPopup();
     initEmail();
     initTypewriter();
     initCounters();
     initMarquee();
     initCursorGlow();
     initMobileSticky();
     renderSchedule();
     applyLiveState(isLive());
   }
   
   document.readyState === 'loading'
     ? document.addEventListener('DOMContentLoaded', init)
     : init();