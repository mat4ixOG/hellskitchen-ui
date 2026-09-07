/**
 * Everything absolute-URL shaped lives here.
 *
 * Canonical tags, Open Graph URLs and the sitemap all need a full origin, and a
 * wrong one is worse than none — it tells Google the real page lives somewhere
 * else. Change SITE_URL here when the custom domain lands and the whole site
 * follows, including the generated sitemap.
 */
export const SITE_URL = 'https://hellskitchen-ui.org';

export const SITE_NAME = "Hell's Kitchen UI";

/** Falls back into <title> and og:title where a route sets nothing. */
export const DEFAULT_TITLE = "Hell's Kitchen UI — free Angular component library";

/**
 * Google truncates around 160 characters, so the distinctive words go first.
 */
export const DEFAULT_DESCRIPTION =
  'Free, MIT-licensed Angular component library for Angular 19-22: a data table with sorting, ' +
  'filtering and virtual scroll, charts, and animated WebGL backgrounds. Standalone and signal-based.';

/** Social preview image, served from public/. 1200x630 is the safe size. */
export const SITE_OG_IMAGE = `${SITE_URL}/og-image.png`;

export const REPO_URL = 'https://github.com/mat4ixOG/hellskitchen-ui';
export const NPM_URL = 'https://www.npmjs.com/package/hellskitchen-ui';

/**
 * Cloudflare Pages serves /foo/ and 308-redirects /foo, so canonical URLs and
 * the sitemap use the trailing-slash form to point at the URL that actually
 * answers 200.
 */
export function canonicalUrl(path: string): string {
  const clean = path.split('#')[0].split('?')[0];
  if (clean === '/' || clean === '') return `${SITE_URL}/`;
  const trimmed = clean.replace(/\/+$/, '');
  return `${SITE_URL}${trimmed}/`;
}

/**
 * Trims a docs description down to something a search result can show.
 *
 * The catalogue descriptions are written for the page, where a long paragraph
 * is fine. A meta description is not the page: Google renders roughly 160
 * characters and drops the rest, so a raw `.slice()` used to hand it a cut
 * mid-word — "footer aggregates, virtua". Cuts on a word boundary instead, and
 * prefers to stop on a sentence end when one falls in range, because a clean
 * sentence reads as a summary rather than as truncated text.
 */
export function metaDescription(text: string, max = 200): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;

  const window = clean.slice(0, max);

  // A sentence ending in the back half is a better stopping point than any
  // word boundary — take it and drop the ellipsis.
  const sentenceEnd = Math.max(window.lastIndexOf('. '), window.lastIndexOf('? '));
  if (sentenceEnd > max * 0.5) return clean.slice(0, sentenceEnd + 1);

  const lastSpace = window.lastIndexOf(' ');
  // Strip punctuation left dangling by the cut, so it is not ", …".
  return `${window.slice(0, lastSpace > 0 ? lastSpace : max).replace(/[,;:.\s]+$/, '')}…`;
}
