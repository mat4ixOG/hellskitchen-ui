# Hell's Kitchen UI — free Angular component library

[![og](public/og-image.png)](https://hellskitchen-ui.org)

Free, MIT-licensed **Angular components** for Angular 19, 20, 21 and 22 — 69 of
them, every one importable from npm: forms (input, select, multi-select,
combobox, date picker, file drop…), overlays (dialog, drawer, popover, tooltip,
toast…), navigation (tabs, stepper, menu, command palette…), a real **data
table**, **line and bar charts**, a tree, layout and feedback components, and
eight **animated WebGL backgrounds**. Standalone, signal-based, SSR-safe — no Tailwind, no icon
font, no global stylesheet.

**[Live docs and demos →](https://hellskitchen-ui.org)** · **[All components →](https://hellskitchen-ui.org/components/)** · **[npm →](https://www.npmjs.com/package/hellskitchen-ui)**

[![npm](https://img.shields.io/npm/v/hellskitchen-ui.svg)](https://www.npmjs.com/package/hellskitchen-ui)
[![downloads](https://img.shields.io/npm/dm/hellskitchen-ui.svg)](https://www.npmjs.com/package/hellskitchen-ui)
[![licence](https://img.shields.io/npm/l/hellskitchen-ui.svg)](./LICENSE)
![Angular](https://img.shields.io/badge/Angular-19%20%7C%2020%20%7C%2021%20%7C%2022-dd0031)

```bash
npm i hellskitchen-ui
```

## What ships, and what does not

This repository holds two things, and the difference matters:

| | What it is | Published? |
| --- | --- | --- |
| `projects/hk-ui` | The library: all 69 components documented on the site | **Yes** — `hellskitchen-ui` |
| `src` | The documentation site, whose demos render the library components | No |

Every component in the site's catalogue is exported from the package, and the
site's demos import them from `hellskitchen-ui` exactly as a consumer would.
`component-catalog.spec.ts` keeps the catalogue in step with the package's
real exports.

Every component is standalone and signal-based, styled with plain CSS. The
package pulls in no Tailwind, no icon font and no global stylesheet.

## Layout

```
projects/hk-ui/src/lib/   the library — one folder per component
projects/hk-ui/src/       public-api.ts: the entire published surface
src/app/shared/demos/     demo components rendered by the docs site
src/app/shared/data/      the component catalogue (drives the site)
src/app/modules/          the site itself — home, catalogue, docs
```

## Developing

The docs site resolves `hellskitchen-ui` to the **built** library in
`dist/hk-ui`, so it consumes exactly what npm ships rather than the source. That
means the library has to be built first — the npm scripts handle it, so prefer
them over bare `ng` commands:

```bash
npm start          # builds the library, then serves the docs site
npm run build      # builds the library, then the site
npm run test:all   # both suites: library, then site
```

Library-only:

```bash
npm run build:lib
npm run test:lib
```

## Publishing

```bash
npm login
npm run pack:lib      # inspect the tarball first — always worth it
npm run publish:lib
```

`publishConfig.access` is already `public`, so a scoped package publishes
without extra flags. Bump `version` in `projects/hk-ui/package.json` before each
release; npm will not accept the same version twice, and it cannot be renamed
afterwards.

## Contributing

Both suites must pass:

```bash
npm run test:all
```

If you add a component to the library, export it from
`projects/hk-ui/src/public-api.ts` — anything not re-exported there is internal
and can change without it being a breaking change.

## Licence

MIT — see [LICENSE](./LICENSE).
