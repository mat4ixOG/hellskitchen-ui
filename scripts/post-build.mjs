/**
 * Static hosts (Cloudflare Pages included) serve /404.html for any path they
 * cannot match. Angular prerenders the route to /404/index.html, so it is
 * copied up to where the host expects it.
 */
import { copyFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const browser = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist', 'hk-docs', 'browser');
const from = join(browser, '404', 'index.html');
const to = join(browser, '404.html');

if (!existsSync(from)) {
  console.error(`post-build: expected ${from} — is the '404' route still prerendered?`);
  process.exit(1);
}
copyFileSync(from, to);
console.log('post-build: 404.html written');

// robots.txt ships from public/, but the sitemap has to be generated after the
// build so it can be written into the output directory.
await import('./gen-sitemap.mjs');
