# Orbit Daily: space news dashboard

A clean, hands-off display: top stories, live clocks, ISS position, next-launch countdown,
auto-scrolling news and a scrolling photo strip. Built for a spare screen or TV.

## Files
- index.html   the whole dashboard (front end)
- api/space.js serverless function: gathers news, ranks by importance, caches 30 min
- package.json minimal project file Vercel expects

## Deploy (easiest: GitHub + Vercel)
1. Create a free account at vercel.com and github.com.
2. Create a new GitHub repository and upload these files, keeping the `api` folder:
   index.html, package.json, api/space.js
3. On vercel.com click Add New > Project, pick the repository, then Deploy.
   Leave every build setting at its default.
4. Open the URL Vercel gives you. Done.

## Deploy (command line)
1. Install Node.js, then open a terminal in this folder.
2. Run: npx vercel --prod
3. Follow the prompts (log in, accept defaults).

## Optional
- NASA key: get a free key at api.nasa.gov, then in Vercel go to
  Project > Settings > Environment Variables, add NASA_API_KEY, and redeploy.
  Without it the site uses NASA's shared demo key, which can get rate-limited.
- Test locally: `npx vercel dev`, then open http://localhost:3000

## How it updates
Vercel caches the news for 30 minutes and the page reloads its data every 30 minutes,
so it stays current with no further work.

## Tweaking
- Colors: the variables at the top of the style block in index.html (--bg, --accent, ...).
- What counts as important: the WEIGHTS list at the top of api/space.js.
- How much shows as "important": the 0.35 in api/space.js (35% of stories).
- Days of NASA pictures: the 8 in api/space.js.

## Kiosk tip
Open the site full screen (F11) on a TV or spare monitor. It needs no clicking.
