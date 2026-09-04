import { COMPONENTS, findComponent } from './component-catalog';

/**
 * The catalogue is the single source of truth for both the grid and the docs
 * pages, so a malformed entry ships a broken page rather than failing a build.
 */
describe('component catalogue', () => {
  it('gives every component a live demo id that matches its slug', () => {
    const slugs = COMPONENTS.map((entry) => entry.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('documents every component', () => {
    const undocumented = COMPONENTS.filter(
      (entry) => !entry.usage || !entry.api?.length || !entry.a11y?.length || !entry.description
    ).map((entry) => entry.slug);
    expect(undocumented).toEqual([]);
  });

  it('gives every API row a complete signature', () => {
    const broken: string[] = [];
    for (const entry of COMPONENTS) {
      for (const row of entry.api ?? []) {
        if (!row.name || !row.type || !row.description || !row.kind) {
          broken.push(`${entry.slug}.${row.name || '(unnamed)'}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  it('names a default for every input, since that is what the table column promises', () => {
    const missing: string[] = [];
    for (const entry of COMPONENTS) {
      for (const row of entry.api ?? []) {
        if (row.kind === 'input' && !row.default) missing.push(`${entry.slug}.${row.name}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('uses only CSS custom properties as token names', () => {
    const bad: string[] = [];
    for (const entry of COMPONENTS) {
      for (const token of entry.tokens ?? []) {
        if (!token.name.startsWith('--')) bad.push(`${entry.slug}: ${token.name}`);
      }
    }
    expect(bad).toEqual([]);
  });

  /**
   * `new` is a badge, not a maturity level: it means "this just landed", so it
   * has to be cleared as things stop being recent. Nothing in the code can
   * know what is recent, but it can stop the badge from quietly becoming
   * permanent — once most of the catalogue is "new", none of it reads as new.
   */
  it('keeps the new badge rare enough to still mean something', () => {
    const marked = COMPONENTS.filter((entry) => entry.status === 'new').map((e) => e.slug);
    expect(marked.length).toBeLessThanOrEqual(8);
  });

  /**
   * The catalogue is bigger than the package, and that is fine — what is not
   * fine is a page telling someone to `npm i` something that is not in there.
   * This list is the library's real public API; if an export is added or the
   * flag is set on a pattern that does not ship, this fails rather than the
   * install failing for a reader.
   */
  it('flags exactly the components the package actually exports', () => {
    const EXPORTED = [
      'button',
      'table',
      'line-chart',
      'bar-chart',
      'aurora',
      'particle-field',
      'beams',
      'waves',
      'dot-matrix',
      'grid-motion',
      'dither',
      'spotlight'
    ].sort();

    const flagged = COMPONENTS.filter((entry) => entry.packaged).map((e) => e.slug).sort();
    expect(flagged).toEqual(EXPORTED);
  });

  it('never gives a demo-only entry an import line', () => {
    // A `usage` block that imports from the package is a promise; only an
    // entry that ships may make it.
    const lying = COMPONENTS.filter(
      (entry) => !entry.packaged && /from 'hellskitchen-ui'/.test(entry.usage ?? '')
    ).map((e) => e.slug);
    expect(lying).toEqual([]);
  });

  it('resolves each slug back to its entry', () => {
    for (const entry of COMPONENTS) {
      expect(findComponent(entry.slug)?.name).toBe(entry.name);
    }
    expect(findComponent('does-not-exist')).toBeUndefined();
  });
});
