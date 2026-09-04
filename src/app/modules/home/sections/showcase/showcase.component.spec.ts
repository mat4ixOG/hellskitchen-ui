import { ShowcaseComponent } from './showcase.component';
import { COMPONENTS, ComponentEntry } from '../../../../shared/data/component-catalog';

/**
 * A PrimeIcons class that does not exist fails silently: the `<i>` still
 * renders, it just has no glyph, so a wrong name reads as a blank gap in the
 * layout rather than an error anyone would notice. `pi-toggle-on` shipped that
 * way — a reasonable guess that PrimeIcons does not actually include.
 *
 * `src/styles.css` is part of the test build and imports primeicons, so the
 * check can be the real one: ask the browser what `::before` resolves to and
 * require an actual glyph rather than trusting a hand-kept list of names.
 *
 * The component is instantiated directly rather than through TestBed — its
 * template pulls in RouterLink, which would drag ActivatedRoute in for a test
 * that never renders anything.
 */
describe('ShowcaseComponent icons', () => {
  const component = new ShowcaseComponent();

  /** The glyph the icon font puts on ::before, or '' when the class is unknown. */
  function glyphFor(classes: string): string {
    const probe = document.createElement('i');
    probe.className = classes;
    document.body.appendChild(probe);
    const content = getComputedStyle(probe, '::before').content;
    probe.remove();
    // An unmapped class resolves to 'none' or an empty string.
    return content === 'none' || content === '""' || content === "''" ? '' : content;
  }

  function blankIconsIn(entries: ComponentEntry[]): string[] {
    return entries
      .map((entry) => ({ slug: entry.slug, icon: component.demoIcon(entry) }))
      .filter((row) => glyphFor(row.icon) === '')
      .map((row) => `${row.slug} → ${row.icon}`);
  }

  it('has the icon font available, or the rest of this suite proves nothing', () => {
    expect(glyphFor('pi pi-check')).not.toBe('');
  });

  it('resolves every showcased component to a glyph that actually exists', () => {
    expect(blankIconsIn(component.demos)).toEqual([]);
  });

  it('resolves every icon in the map, not only the currently featured ones', () => {
    expect(blankIconsIn(COMPONENTS)).toEqual([]);
  });

  it('falls back to a real glyph for a component with no explicit icon', () => {
    expect(glyphFor(component.demoIcon({ slug: 'not-mapped' } as ComponentEntry))).not.toBe('');
  });
});
