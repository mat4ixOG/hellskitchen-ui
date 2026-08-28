/** Structured doc content — rendered generically by DocBlocksComponent. */

export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string; id: string }
  | { kind: 'code'; code: string; file?: string }
  | { kind: 'list'; items: string[]; ordered?: boolean }
  | { kind: 'note'; tone: 'info' | 'warn' | 'good'; text: string }
  | { kind: 'table'; head: string[]; rows: string[][] };

export interface Guide {
  id: string;
  title: string;
  blurb: string;
  icon: string;
  blocks: Block[];
  /**
   * Kept in the data but hidden from the nav, the docs index and prev/next.
   * The route still resolves, so an existing link is not broken — the guide
   * simply is not advertised. Flip this off to bring it back.
   */
  hidden?: boolean;
}

export const GUIDES: Guide[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    blurb: 'Install, import one component, ship.',
    icon: 'pi pi-play',
    blocks: [
      { kind: 'p', text: 'Every component is standalone. There is no module to import, no global config to register, and nothing to bootstrap before first use.' },
      { kind: 'h', text: 'Install', id: 'install' },
      { kind: 'code', code: 'npm i @hellskitchen/ui\n# or\npnpm add @hellskitchen/ui', file: 'terminal' },
      { kind: 'h', text: 'Add the token layer', id: 'tokens' },
      { kind: 'p', text: 'One stylesheet import gives you the default dark theme. Skip it and every component falls back to the browser defaults for colour — nothing breaks, it just looks unstyled.' },
      { kind: 'code', code: '/* styles.css */\n@import "@hellskitchen/ui/tokens.css";', file: 'src/styles.css' },
      { kind: 'h', text: 'Use a component', id: 'use' },
      {
        kind: 'code',
        file: 'settings.component.ts',
        code: `import { Component, signal } from '@angular/core';
import { HkSwitch } from '@hellskitchen/ui';

@Component({
  selector: 'app-settings',
  imports: [HkSwitch],
  template: \`
    <hk-switch [(checked)]="notify" label="Email me on deploy" />
  \`
})
export class SettingsComponent {
  notify = signal(true);
}`
      },
      { kind: 'note', tone: 'good', text: 'That is the whole setup. Import what you use; the bundler drops the rest.' },
      { kind: 'h', text: 'Requirements', id: 'requirements' },
      {
        kind: 'table',
        head: ['Dependency', 'Version', 'Note'],
        rows: [
          ['Angular', '19.0 or newer', 'Standalone components and signal inputs are used throughout'],
          ['TypeScript', '5.6 or newer', 'Matches the Angular 19 requirement'],
          ['Runtime deps', 'none', 'No CDK, no RxJS operators beyond what Angular already ships']
        ]
      }
    ]
  },
  {
    id: 'theming',
    title: 'Theming',
    blurb: 'Eight custom properties, no compile step.',
    icon: 'pi pi-palette',
    blocks: [
      { kind: 'p', text: 'Theming is plain CSS custom properties. There is no preset object, no SASS build and no runtime theme engine — set the properties and every component follows on the next paint.' },
      { kind: 'h', text: 'The token layer', id: 'layer' },
      {
        kind: 'code',
        file: 'src/styles.css',
        code: `:root {
  --hk-accent: #dc2626;
  --hk-accent-soft: rgb(220 38 38 / 0.16);
  --hk-surface: #0b0b0c;
  --hk-border: rgb(255 255 255 / 0.10);
  --hk-text: #f5f5f5;
  --hk-radius: 12px;
  --hk-density: 1;
  --hk-motion: 200ms;
}`
      },
      { kind: 'h', text: 'Scoped overrides', id: 'scoped' },
      { kind: 'p', text: 'Because they are inherited properties, any subtree can carry its own theme. This is how you get a differently-themed panel without a second theme file:' },
      { kind: 'code', code: `<section style="--hk-accent: #8b5cf6; --hk-radius: 4px">
  <!-- everything in here is violet and sharp-cornered -->
</section>` },
      { kind: 'h', text: 'Per-component tokens', id: 'per-component' },
      { kind: 'p', text: 'Each component documents its own tokens on its page — they all default to a global token, so you only reach for them when one component needs to differ.' },
      { kind: 'code', code: `hk-switch {\n  --hk-switch-track: #1f2937;\n  --hk-switch-ease: linear;\n}` },
      { kind: 'h', text: 'Light mode', id: 'light' },
      { kind: 'p', text: 'There is no dark class to toggle. Redefine the tokens under whatever selector or media query you already use:' },
      {
        kind: 'code',
        code: `@media (prefers-color-scheme: light) {
  :root {
    --hk-surface: #ffffff;
    --hk-text: #111827;
    --hk-border: rgb(0 0 0 / 0.10);
  }
}`
      },
      { kind: 'note', tone: 'info', text: 'HkThemeService reads and writes the same properties at runtime and persists the result, if you would rather ship a theme picker than a stylesheet.' }
    ]
  },
  {
    id: 'motion',
    title: 'Motion',
    blurb: 'How transitions are timed, and how to turn them off.',
    icon: 'pi pi-bolt',
    blocks: [
      { kind: 'p', text: 'Animation is part of the component, not an add-on. Every transition derives from one duration token and one of three easing curves, so a screen full of components moves as a single system.' },
      { kind: 'h', text: 'The curves', id: 'curves' },
      {
        kind: 'table',
        head: ['Curve', 'Value', 'Used for'],
        rows: [
          ['standard', 'cubic-bezier(.4, 0, .2, 1)', 'Colour, opacity, small position shifts'],
          ['decelerate', 'cubic-bezier(.16, 1, .3, 1)', 'Enters — panels, popovers, toasts'],
          ['spring', 'cubic-bezier(.34, 1.56, .64, 1)', 'Controls that should feel physical — switch thumbs, indicators']
        ]
      },
      { kind: 'h', text: 'Scaling everything at once', id: 'scale' },
      { kind: 'code', code: `:root { --hk-motion: 120ms; }   /* snappier everywhere */\n:root { --hk-motion: 0ms; }     /* off everywhere */` },
      { kind: 'h', text: 'Reduced motion', id: 'reduced' },
      { kind: 'p', text: 'Every component checks prefers-reduced-motion and drops to an instant state change — including things driven by JavaScript, like the count-up directive, which snaps to its final number instead of skipping the update.' },
      { kind: 'note', tone: 'warn', text: 'If you write your own transitions on top of a component, guard them the same way. A reduced-motion user should never see a component half-animate because a wrapper kept moving.' }
    ]
  },
  {
    id: 'accessibility',
    title: 'Accessibility',
    blurb: 'What is guaranteed, and what is still on you.',
    icon: 'pi pi-check-circle',
    blocks: [
      { kind: 'p', text: 'A component that skips keyboard support is not finished, so none of these ship without it. Here is the standing contract.' },
      { kind: 'h', text: 'Guaranteed', id: 'guaranteed' },
      {
        kind: 'list',
        items: [
          'Correct roles and ARIA state on every interactive element, reflecting the live model — never set once at render.',
          'Full keyboard operation, documented per component, including roving tabindex where a group owns a single tab stop.',
          'Visible focus that survives theming — focus rings derive from --hk-accent, so they follow your palette.',
          'Focus trapped and restored by overlays; the trigger gets focus back on close.',
          'Live regions for anything that appears unprompted, with polite or assertive chosen by tone.'
        ]
      },
      { kind: 'h', text: 'Still your job', id: 'your-job' },
      {
        kind: 'list',
        items: [
          'Writing labels that mean something. Every control accepts one; none of them invent it.',
          'Contrast of your chosen accent against your chosen surface — the tokens do not police each other.',
          'Reading order of your page. A component cannot fix a layout that tabs sideways.'
        ]
      },
      { kind: 'note', tone: 'info', text: 'Found a gap? That is a bug, not a feature request, and it jumps the queue.' }
    ]
  },
  {
    id: 'from-primeng',
    title: 'Coming from PrimeNG',
    blurb: 'What maps across, and what deliberately does not.',
    icon: 'pi pi-arrow-right-arrow-left',
    blocks: [
      { kind: 'p', text: 'PrimeNG is a good library and this is not a drop-in replacement for it. If you are migrating piece by piece, here is the honest mapping.' },
      {
        kind: 'table',
        head: ['PrimeNG', 'Here', 'Difference that matters'],
        rows: [
          ['p-inputSwitch', 'hk-switch', 'Signal model, three sizes, no ripple'],
          ['p-tabView', 'hk-tabs', 'Indicator measures real boxes; panels are separate elements'],
          ['p-toast + MessageService', 'hk-toast-host + HkToastService', 'Typed payload, stack cap, pause on focus'],
          ['p-accordion', 'hk-accordion', 'Animates grid rows, so unknown heights still ease'],
          ['p-table', 'hk-table', 'Smaller and virtual-scroll first; fewer built-in features'],
          ['PrimeNG theme presets', 'CSS custom properties', 'No preset objects — read and edit the tokens directly']
        ]
      },
      { kind: 'h', text: 'Running both at once', id: 'both' },
      { kind: 'p', text: 'They do not collide: selectors are prefixed hk-, and the token layer only defines --hk-* properties. Migrate one screen at a time.' },
      { kind: 'note', tone: 'warn', text: 'What you lose: PrimeNG has far more surface area — charts, org charts, editors, a much richer table. Nothing here pretends to replace those yet.' }
    ]
  },
  {
    id: 'contributing',
    title: 'Contributing',
    blurb: 'The library is the point. Help build it.',
    icon: 'pi pi-github',
    // Hidden until the library is worth contributing to — revisit once there
    // is enough surface area for an outside contribution to land cleanly.
    hidden: true,
    blocks: [
      { kind: 'p', text: 'The whole reason this is MIT is so more people can pick Angular and ship without a licence conversation. Contributions are the fastest way to make that true.' },
      { kind: 'h', text: 'Local setup', id: 'setup' },
      { kind: 'code', code: 'git clone https://github.com/hellskitchen-ui/ui\ncd ui\nnpm ci\nnpm start        # docs site\nnpm test         # unit tests\nnpm run build:lib', file: 'terminal' },
      { kind: 'h', text: 'What a finished component looks like', id: 'bar' },
      {
        kind: 'list',
        ordered: true,
        items: [
          'Standalone, signal inputs, OnPush, no runtime dependency beyond Angular.',
          'Keyboard map documented and tested — not just clicked through.',
          'Tokens for every colour, radius and duration it uses. No hard-coded hex.',
          'A reduced-motion path.',
          'A demo on the docs page with the exact snippet that renders it.'
        ]
      },
      { kind: 'note', tone: 'good', text: 'Good first issues are tagged. Docs fixes count — they are usually the ones that help the most people.' }
    ]
  }
];

/** Guides shown in navigation. Hidden ones stay reachable by direct link. */
export const VISIBLE_GUIDES: Guide[] = GUIDES.filter((guide) => !guide.hidden);

export function findGuide(id: string): Guide | undefined {
  return GUIDES.find((guide) => guide.id === id);
}
