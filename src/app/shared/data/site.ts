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
