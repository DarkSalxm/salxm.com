# DarkSalxm Website

Official creator hub for DarkSalxm, a chaotic fake VTuber, streamer, and content creator.

## What this site does

- Introduces visitors to DarkSalxm within the first few seconds
- Sends viewers to Twitch, Discord, YouTube, TikTok, X, and Instagram
- Shows the weekly stream schedule
- Embeds Twitch during scheduled live windows and YouTube when offline
- Works as a cleaner creator hub than a basic Linktree

## Files

- `index.html`: Main page structure, SEO, hero, about, socials, schedule, watch, support, and footer
- `style.css`: Visual design, layout, mobile responsiveness, buttons, cards, animations, and accessibility motion handling
- `script.js`: Schedule rendering, live-window state, Twitch/YouTube embeds, mobile nav, scroll effects, and sticky CTA behavior

## Updating the stream schedule

Edit the `SCHEDULE` array at the top of `script.js`.

Example:

```js
{ day:'Fri', stream:true, icon:'👾', time:'7–11 PM', game:'Community Night', note:'YOU pick the game. Bring chaos.' }
```

## Updating social links

Most social links live in `index.html`. Search for the platform name, then replace the URL.

## Important notes

The current live state is based on the schedule window, not the official Twitch API. Use `?live=1` or `?live=0` in the URL to test live and offline states.

## Deployment

Upload `index.html`, `style.css`, and `script.js` to the same folder on your host or GitHub Pages repo.
