/**
 * Emits each demo's real source into `public/demo-source/<slug>.json`, so the
 * "Open in StackBlitz" button can hand over a project that actually runs.
 *
 * Why files on disk rather than bundled strings: there are ~60 demos and the
 * chatbot alone is five files. Importing them all as raw text would put every
 * demo's source into the initial bundle for the benefit of the one person who
 * clicks the button. These are fetched on demand and cost nothing otherwise.
 *
 * Relative imports are followed recursively, so a demo that reaches for a
 * shared directive or a sibling file ships with it and compiles on the far
 * side. Bare imports (@angular/*, hellskitchen-ui) are left alone — they are
 * dependencies, not sources.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const demosDir = join(root, 'src/app/shared/demos');
const outDir = join(root, 'public/demo-source');

/** slug -> path, read straight off the registry so the two cannot drift. */
function readRegistry() {
  const source = readFileSync(join(demosDir, 'demo-registry.ts'), 'utf8');
  const body = source.slice(source.indexOf('export const DEMOS'), source.indexOf('export const WIDE_DEMOS'));
  const entries = new Map();
  const pattern = /(?:'([^']+)'|([A-Za-z][\w-]*))\s*:\s*\(\)\s*=>\s*import\('([^']+)'\)/g;
  let match;
  while ((match = pattern.exec(body))) {
    entries.set(match[1] ?? match[2], match[3]);
  }
  return entries;
}

/** Resolve a relative import to a real file, trying the usual suffixes. */
function resolveImport(fromFile, spec) {
  const base = resolve(dirname(fromFile), spec);
  for (const candidate of [base, `${base}.ts`, join(base, 'index.ts')]) {
    if (existsSync(candidate) && !candidate.endsWith('/')) {
      try {
        if (readFileSync(candidate)) return candidate;
      } catch {
        /* a directory — keep trying */
      }
    }
  }
  return null;
}

/** Every file a component pulls in: its own template/styles, then imports. */
function collect(entryFile, seen = new Map()) {
  const abs = resolve(entryFile);
  if (seen.has(abs) || !existsSync(abs)) return seen;

  const source = readFileSync(abs, 'utf8');
  seen.set(abs, source);

  // templateUrl / styleUrl / styleUrls sit next to the component.
  for (const m of source.matchAll(/(?:templateUrl|styleUrl)\s*:\s*'([^']+)'/g)) {
    const sibling = resolve(dirname(abs), m[1]);
    if (existsSync(sibling)) seen.set(sibling, readFileSync(sibling, 'utf8'));
  }
  for (const m of source.matchAll(/styleUrls\s*:\s*\[([^\]]*)\]/g)) {
    for (const s of m[1].matchAll(/'([^']+)'/g)) {
      const sibling = resolve(dirname(abs), s[1]);
      if (existsSync(sibling)) seen.set(sibling, readFileSync(sibling, 'utf8'));
    }
  }

  for (const m of source.matchAll(/from\s+'(\.[^']+)'/g)) {
    const next = resolveImport(abs, m[1]);
    if (next) collect(next, seen);
  }

  return seen;
}

const registry = readRegistry();
rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

let written = 0;
const missing = [];

for (const [slug, importPath] of registry) {
  const entry = resolveImport(join(demosDir, 'demo-registry.ts'), importPath);
  if (!entry) {
    missing.push(slug);
    continue;
  }

  const files = {};
  let componentClass = null;

  for (const [abs, content] of collect(entry)) {
    // Paths stay repo-relative, so every relative import inside them still
    // resolves in the generated project without rewriting a single line.
    files[relative(root, abs)] = content;
  }

  const entrySource = readFileSync(entry, 'utf8');
  const classMatch = entrySource.match(/export class (\w+)/);
  componentClass = classMatch ? classMatch[1] : null;

  if (!componentClass) {
    missing.push(`${slug} (no exported class)`);
    continue;
  }

  writeFileSync(
    join(outDir, `${slug}.json`),
    JSON.stringify(
      {
        slug,
        entry: relative(root, entry).replace(/\.ts$/, ''),
        componentClass,
        files
      },
      null,
      0
    )
  );
  written++;
}

console.log(`gen-demo-source: ${written} demos written to public/demo-source`);
if (missing.length) console.warn(`gen-demo-source: skipped ${missing.join(', ')}`);
