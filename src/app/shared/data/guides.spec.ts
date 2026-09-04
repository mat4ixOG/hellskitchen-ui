import { GUIDES, VISIBLE_GUIDES, findGuide } from './guides';

describe('guides', () => {
  it('keeps hidden guides out of navigation', () => {
    expect(VISIBLE_GUIDES.some((guide) => guide.hidden)).toBeFalse();
    expect(VISIBLE_GUIDES.length).toBeLessThan(GUIDES.length);
  });

  it('hides contributing for now', () => {
    expect(VISIBLE_GUIDES.map((guide) => guide.id)).not.toContain('contributing');
  });

  it('still resolves a hidden guide by direct link, so old URLs do not 404', () => {
    // Hiding is a navigation decision, not a deletion — the content is intact
    // and the route still answers.
    const guide = findGuide('contributing');
    expect(guide).toBeTruthy();
    expect(guide!.blocks.length).toBeGreaterThan(0);
  });

  it('gives every visible guide the fields the nav renders', () => {
    for (const guide of VISIBLE_GUIDES) {
      expect(guide.id).toBeTruthy();
      expect(guide.title).toBeTruthy();
      expect(guide.blurb).toBeTruthy();
      expect(guide.icon).toBeTruthy();
    }
  });
});
