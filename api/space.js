// Vercel serverless function: pulls every space news source the Spaceflight News
// API aggregates (articles, blogs, reports), scores each story for importance,
// and caches the result at the edge.
const get = (u) => fetch(u).then((r) => (r.ok ? r.json() : null)).catch(() => null);

const WEIGHTS = [
  [4, /\b(crash|explos\w*|anomal\w*|fail\w*|abort\w*|emergency|collision|lost contact)\b/i],
  [3, /\b(launch\w*|land\w*|liftoff|splashdown|docking|spacewalk|crewed|orbit\w*|first|record|historic)\b/i],
  [3, /\b(discover\w*|detect\w*|confirm\w*|reveal\w*|breakthrough|evidence|signal)\b/i],
  [2, /\b(artemis|starship|starliner|webb|hubble|iss|mars|moon|lunar|asteroid|comet|eclipse|supernova|black hole|exoplanet|neutron|new glenn|vulcan|sls|falcon)\b/i],
  [2, /\b(nasa|spacex|esa|isro|jaxa|cnsa|roscosmos|blue origin|rocket lab|ula|boeing)\b/i],
  [-2, /\b(opinion|podcast|webinar|sponsored|deal|discount|stock|shares|earnings|appoints|hires|partnership)\b/i],
];
const STOP = new Set('the a an of to in on for and with from by as at is are be new after over into its it this that will says say first space nasa spacex'.split(' '));
const words = (t) => new Set(t.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(' ').filter((w) => w.length > 3 && !STOP.has(w)));

module.exports = async function handler(req, res) {
  const key = process.env.NASA_API_KEY || 'DEMO_KEY';
  const start = new Date(Date.now() - 8 * 864e5).toISOString().slice(0, 10);
  const base = 'https://api.spaceflightnewsapi.net/v4';
  const [a, b, r, launches, apod] = await Promise.all([
    get(`${base}/articles/?limit=60`),
    get(`${base}/blogs/?limit=30`),
    get(`${base}/reports/?limit=15`),
    get('https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=5&mode=list'),
    get(`https://api.nasa.gov/planetary/apod?api_key=${key}&start_date=${start}`),
  ]);

  const seen = new Set();
  const items = [...(a?.results || []), ...(b?.results || []), ...(r?.results || [])]
    .filter((x) => x.url && !seen.has(x.url) && seen.add(x.url))
    .map((x) => ({ ...x, _w: words(x.title) }));

  for (const x of items) {
    const hours = (Date.now() - new Date(x.published_at)) / 36e5;
    let s = (x.featured ? 3 : 0) + 4 * Math.exp(-hours / 24);
    const text = `${x.title} ${x.summary || ''}`;
    for (const [w, re] of WEIGHTS) if (re.test(text)) s += w;
    // Many outlets covering the same story = bigger story
    const covered = items.filter((y) => y !== x && y.news_site !== x.news_site &&
      [...x._w].filter((w) => y._w.has(w)).length >= 2).length;
    x.score = +(s + Math.min(covered * 1.5, 6)).toFixed(2);
  }
  items.sort((p, q) => q.score - p.score);
  const cut = Math.ceil(items.length * 0.35);
  items.forEach((x, i) => { x.important = i < cut; delete x._w; });

  res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
  res.status(200).json({
    articles: items,
    launches: launches?.results || [],
    apod: Array.isArray(apod) ? apod : apod ? [apod] : [],
  });
}
