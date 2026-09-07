/**
 * Writes llms.txt — the index an LLM or coding agent reads to learn what this
 * library ships, without installing anything or crawling 69 HTML pages.
 *
 * Same source as the sitemap and the site itself, so a component added to the
 * catalogue shows up here too. The point of the file is the `packaged` flag:
 * the catalogue documents far more than npm exports, and an agent that cannot
 * tell the difference writes an import that does not resolve.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const site = read('src/app/shared/data/site.ts');
const pick = (key) => site.match(new RegExp(`${key}\\s*=\\s*'([^']+)'`))?.[1];
const siteUrl = pick('SITE_URL');
if (!siteUrl) throw new Error('could not read SITE_URL from site.ts');

const catalog = read('src/app/shared/data/component-catalog.ts');

// Entries start at a 4-space `slug:` and run to the next one. The interface
// declaration sits at 2-space indent, so it is not picked up.
const blocks = catalog.split(/\n(?=    slug: ')/).slice(1);
const field = (block, key) => block.match(new RegExp(`^    ${key}: '([^']*)'`, 'm'))?.[1];

const components = blocks
  .map((b) => ({
    slug: field(b, 'slug'),
    name: field(b, 'name'),
    selector: field(b, 'selector'),
    category: field(b, 'category'),
    tagline: field(b, 'tagline'),
    packaged: /^    packaged: true/m.test(b)
  }))
  .filter((c) => c.slug && c.name);

if (components.length < 60) throw new Error(`only parsed ${components.length} components — catalogue shape changed`);

const guides = read('src/app/shared/data/guides.ts');
const guideList = [...guides.matchAll(/^    id: '([a-z0-9-]+)',\n    title: '([^']+)',\n    blurb: '([^']+)'/gm)].map(
  ([, id, title, blurb]) => ({ id, title, blurb })
);
if (!guideList.length) throw new Error('guide shape changed');

const packaged = components.filter((c) => c.packaged);
const reference = components.filter((c) => !c.packaged);

const byCategory = (list) =>
  [...new Set(list.map((c) => c.category))]
    .map(
      (cat) =>
        `\n### ${cat}\n\n` +
        list
          .filter((c) => c.category === cat)
          .map(
            (c) =>
              `- [${c.name} (\`<${c.selector}>\`)](${siteUrl}/docs/component/${c.slug}/): ${c.tagline}`
          )
          .join('\n')
    )
    .join('\n');

const out = `# Hell's Kitchen UI

> A free, MIT-licensed Angular component library for Angular 19-22. Every
> component is standalone and signal-based, styled with plain CSS custom
> properties. The package pulls in no Tailwind, no icon font and no global
> stylesheet, and is safe to render under SSR.

Install: \`npm i hellskitchen-ui\`

Selectors are prefixed \`hk-\`, and the token layer only defines \`--hk-*\`
custom properties, so the library can sit alongside Angular Material or PrimeNG
in the same application without colliding.

## Important: what npm actually ships

This site documents ${components.length} components. Only ${packaged.length} of them are exported from
the \`hellskitchen-ui\` package. The rest are reference implementations —
self-contained source to read and copy, written to show how the pattern is
built. **Do not write an import for anything in the reference section; it will
not resolve.**

## Exported from \`hellskitchen-ui\`
${byCategory(packaged)}

## Reference implementations (copy the source, do not import)
${byCategory(reference)}

## Guides

${guideList.map((g) => `- [${g.title}](${siteUrl}/docs/guide/${g.id}/): ${g.blurb}`).join('\n')}

## Other

- [All components](${siteUrl}/components/): the browsable catalogue with live previews
- [npm package](https://www.npmjs.com/package/hellskitchen-ui)
- [Source](${pick('REPO_URL')})
`;

writeFileSync(join(root, 'dist', 'hk-docs', 'browser', 'llms.txt'), out);
console.log(`llms.txt: ${packaged.length} exported, ${reference.length} reference, ${guideList.length} guides`);
