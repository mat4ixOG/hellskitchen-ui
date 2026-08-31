/**
 * Writes sitemap.xml from the same data that drives the pages, so a component
 * added to the catalogue appears in the sitemap without anyone maintaining a
 * second list.
 *
 * URLs use the trailing-slash form: Cloudflare Pages serves /foo/ and
 * 308-redirects /foo, so the slash version is the one that answers 200 and the
 * one that should be advertised.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const siteUrl = read('src/app/shared/data/site.ts').match(/SITE_URL\s*=\s*'([^']+)'/)?.[1];
if (!siteUrl) throw new Error('could not read SITE_URL from site.ts');

const idsFrom = (src, key) =>
  [...src.matchAll(new RegExp(`^\\s+${key}: '([a-z0-9-]+)'`, 'gm'))].map((m) => m[1]);

const slugs = idsFrom(read('src/app/shared/data/component-catalog.ts'), 'slug');
const guides = idsFrom(read('src/app/shared/data/guides.ts'), 'id');
if (!slugs.length || !guides.length) throw new Error('catalogue or guide shape changed');

// priority reflects how much each page matters as an entry point, not quality.
const pages = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/components/', priority: '0.9', changefreq: 'weekly' },
  { path: '/docs/', priority: '0.8', changefreq: 'weekly' },
  ...guides.map((id) => ({ path: `/docs/guide/${id}/`, priority: '0.7', changefreq: 'monthly' })),
  ...slugs.map((slug) => ({ path: `/docs/component/${slug}/`, priority: '0.6', changefreq: 'monthly' }))
];

const today = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
  .map(
    (p) => `  <url>
    <loc>${siteUrl}${p.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;

const out = join(root, 'dist', 'hk-docs', 'browser', 'sitemap.xml');
writeFileSync(out, xml);
console.log(`sitemap.xml: ${pages.length} urls`);
