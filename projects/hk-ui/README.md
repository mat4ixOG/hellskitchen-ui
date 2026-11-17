# hellskitchen-ui — Angular UI component library

Themeable **Angular components** for Angular 19, 20, 21 and 22 — all 69
components from the documentation site: form controls, overlays, navigation, a
real **data table** with sorting, filtering, grouped headers, virtual scroll and
CSV export, **line and bar charts**, a tree, layout and feedback components, and
eight **animated WebGL backgrounds**.
Standalone, signal-based, and styled with plain CSS — no Tailwind, no icon font,
no global stylesheet to import.

```bash
npm i hellskitchen-ui
```

**[Live documentation, with every component running →](https://hellskitchen-ui.org)**

## Angular version support

`@angular/core`, `@angular/common` and `@angular/forms` are peer
dependencies, so you keep the Angular version you already have.

| Angular | Supported |
| --- | --- |
| 22.x | ✅ |
| 21.x | ✅ |
| 20.x | ✅ |
| 19.x | ✅ |
| ≤ 18 | ❌ — the package is built on the signal inputs API |

Works in both zone-based and **zoneless** applications, and is safe to render
under **SSR** — nothing touches `window`, `document` or a canvas before
`afterNextRender`.

## Components

Every component on the [documentation site][docs] is exported from this
package — each docs page shows its import line and API.

| Category | Components |
| --- | --- |
| Forms | Button, Switch, Checkbox, Radio group, Input, Textarea, Password, Pin input, Slider, Rating, Select, Multi select, Combobox, Date picker, File drop, Form field, Signup form |
| Overlay | Dialog, Drawer, Popover, Tooltip, Confirm, Context menu |
| Navigation | Navbar, Tabs, Stepper, Breadcrumb, Pagination, Menu, Sidebar nav, Command palette |
| Feedback | Toast, Accordion, Alert, Progress, Skeleton, Spinner, Empty state |
| Layout | Card, Divider, Split pane, Scroll area, Stack, App shell, Carousel |
| Data | Table, Tree, Tag, Badge, Avatar, Timeline, Stat, Line chart, Bar chart |
| Backgrounds | Aurora, Particle field, Beams, Waves, Dot matrix, Grid motion, Dither, Spotlight |
| AI | Chatbot |
| Utility | Reveal, Count up, Clipboard, Hotkey, Theme, Intersect |

## Usage

Every component is standalone — import the one you use and nothing else reaches
your bundle.

```ts
import { Component, signal } from '@angular/core';
import { HkButtonComponent } from 'hellskitchen-ui';

@Component({
  selector: 'app-deploy',
  imports: [HkButtonComponent],
  template: `
    <button hkButton variant="solid" tone="brand" [loading]="busy()" (pressed)="deploy()">
      Deploy
    </button>

    <!-- A count the button carries itself -->
    <button hkButton variant="soft" [badge]="unread()">Inbox</button>
  `
})
export class DeployComponent {
  readonly busy = signal(false);
  readonly unread = signal(12);
  deploy() { /* … */ }
}
```

## Theming

Components read CSS custom properties rather than exposing a theme prop, so one
declaration retunes everything — including components rendered by code you do
not control.

```css
:root {
  --hk-accent: #dc2626;   /* fills, rails, focus rings */
  --hk-surface: #ffffff;  /* component background */
  --hk-border: rgb(15 23 42 / 0.10);
  --hk-text: #0f172a;
  --hk-radius: 12px;      /* every component derives from it */
  --hk-density: 1;        /* multiplier on internal padding */
  --hk-motion: 200ms;     /* set to 0 to disable animation */
}
```

Dark mode is a `.dark` class on the root element; the components respond to it
without any further wiring.

### One line of setup: cascade layers

Components wrap their `:host` rules in `@layer components`, so your own CSS
overrides them without a specificity fight. Which layer wins is decided by
**declaration order**, and with no explicit order the browser ranks layers by
whichever it encounters first — that is, by bundle order, which you do not
control. Declare the order once in your global stylesheet:

```css
@layer components, utilities;
```

Tailwind users already have this; Tailwind v4 declares its own layer order, so
put `components` before Tailwind's `utilities` and utility classes such as
`absolute inset-0` will apply to our components as they do to your own markup.

Skip it and the components still work — but an override placed in a layer may
lose to the component default depending on load order.

## Accessibility (a11y) and reduced motion

Interactive components ship their ARIA wiring rather than leaving it to the
caller: the button announces `aria-busy` while loading and blocks the press, the
table exposes sort and filter state, and every animation is dropped under
`prefers-reduced-motion` while keeping the component legible at rest.

## Status

`0.x` — the API may change between minor versions. Pin an exact version if that
matters to you.

## Licence

MIT

[docs]: https://hellskitchen-ui.org
