import { Injectable, signal } from '@angular/core';

interface DemoSource {
  slug: string;
  /** Repo-relative path to the demo component, without the .ts suffix. */
  entry: string;
  componentClass: string;
  files: Record<string, string>;
}

/**
 * "Open in StackBlitz" — builds a runnable Angular project from a demo's real
 * source and hands it over.
 *
 * No SDK dependency: StackBlitz opens a project from an ordinary form POST to
 * `/run`, which is all `@stackblitz/sdk` does for this case. A UI library
 * should not add a runtime dependency to its docs site for one button.
 *
 * The demo's own files go in at their repo paths, so every relative import
 * inside them still resolves and nothing has to be rewritten. What is
 * generated around them is only the shell an Angular app needs to boot.
 */
@Injectable({ providedIn: 'root' })
export class StackblitzService {
  /** Slug currently being prepared, for a spinner on the button. */
  readonly busy = signal<string | null>(null);
  readonly error = signal('');

  private readonly cache = new Map<string, DemoSource>();

  async open(slug: string, name: string, packaged: boolean): Promise<void> {
    if (this.busy()) return;
    this.busy.set(slug);
    this.error.set('');

    try {
      const source = await this.load(slug);
      // Whether the sandbox needs the package is a fact about the source, not
      // something to assume: only four demos import it, and adding it to the
      // other sixty-five made every one of their sandboxes fail `npm install`.
      const needsLibrary = Object.values(source.files).some((file) =>
        file.includes("from 'hellskitchen-ui'")
      );
      const files = { ...source.files, ...this.shell(source, name, packaged, needsLibrary) };
      this.submit(files, name, slug, source.entry);
    } catch {
      this.error.set('Could not build the StackBlitz project. Try the Code tab instead.');
    } finally {
      this.busy.set(null);
    }
  }

  private async load(slug: string): Promise<DemoSource> {
    const cached = this.cache.get(slug);
    if (cached) return cached;

    const response = await fetch(`/demo-source/${slug}.json`);
    if (!response.ok) throw new Error(`No source for ${slug}`);
    const source = (await response.json()) as DemoSource;
    this.cache.set(slug, source);
    return source;
  }

  /** The files StackBlitz needs that are not the demo itself. */
  private shell(
    source: DemoSource,
    name: string,
    packaged: boolean,
    needsLibrary: boolean
  ): Record<string, string> {
    // The demo lives at src/app/…; the generated root component sits beside it
    // at src/app/app.component.ts, so this is the path between them.
    const importPath = `./${source.entry.replace(/^src\/app\//, '')}`;

    return {
      'package.json': this.packageJson(source.slug, needsLibrary),
      'angular.json': ANGULAR_JSON,
      'tsconfig.json': TSCONFIG,
      'tsconfig.app.json': TSCONFIG_APP,
      '.postcssrc.json': POSTCSS,
      'src/index.html': indexHtml(name),
      'src/main.ts': MAIN_TS,
      'src/styles.css': STYLES,
      'src/app/app.component.ts': appComponent(importPath, source.componentClass, source.slug),
      'README.md': readme(name, source.slug, packaged)
    };
  }

  private packageJson(slug: string, needsLibrary: boolean): string {
    return JSON.stringify(
      {
        name: `hellskitchen-${slug}`,
        private: true,
        scripts: { start: 'ng serve', build: 'ng build' },
        dependencies: {
          '@angular/common': '^19.2.0',
          '@angular/compiler': '^19.2.0',
          '@angular/core': '^19.2.0',
          '@angular/forms': '^19.2.0',
          '@angular/platform-browser': '^19.2.0',
          '@angular/router': '^19.2.0',
          // Only when the demo actually imports it, and by dist-tag rather
          // than a range: a pinned `^1.0.0` here resolves against the *npm
          // registry*, not this repo, so it breaks the sandbox for everyone
          // during the window where the local version is ahead of what is
          // published. `latest` is always a version that exists.
          ...(needsLibrary ? { 'hellskitchen-ui': 'latest' } : {}),
          primeicons: '^8.0.0',
          rxjs: '~7.8.0',
          tslib: '^2.3.0',
          'zone.js': '~0.15.0'
        },
        devDependencies: {
          '@angular/cli': '^19.2.0',
          '@angular/compiler-cli': '^19.2.0',
          '@angular-devkit/build-angular': '^19.2.0',
          '@tailwindcss/postcss': '^4.1.0',
          postcss: '^8.5.0',
          tailwindcss: '^4.1.0',
          typescript: '~5.7.2'
        }
      },
      null,
      2
    );
  }

  /**
   * StackBlitz opens a project from a form POST — one field per file. Built
   * and submitted rather than fetched, because the response is a page for the
   * user, not data for us.
   */
  private submit(
    files: Record<string, string>,
    name: string,
    slug: string,
    entry: string
  ): void {
    const form = document.createElement('form');
    form.method = 'POST';
    // `file=` decides which tab is open when it lands: the demo's own
    // component, not the generated boilerplate around it.
    form.action = `https://stackblitz.com/run?file=${encodeURIComponent(`${entry}.ts`)}`;
    form.target = '_blank';
    form.style.display = 'none';

    const add = (key: string, value: string): void => {
      const field = document.createElement('input');
      field.type = 'hidden';
      field.name = key;
      field.value = value;
      form.appendChild(field);
    };

    add('project[title]', `${name} — Hell's Kitchen UI`);
    add('project[description]', `The ${name} demo from hellskitchen-ui, running.`);
    add('project[template]', 'node');
    for (const [path, content] of Object.entries(files)) {
      add(`project[files][${path}]`, content);
    }

    document.body.appendChild(form);
    form.submit();
    form.remove();
  }
}

// ── Generated shell ────────────────────────────────────────────

const MAIN_TS = `import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent).catch((error) => console.error(error));
`;

/**
 * NgComponentOutlet rather than the component in the template directly: some
 * demos take a \`slug\` input (all eight backgrounds share one stage component)
 * and most do not. Binding \`[slug]\` in a template would be a compile error on
 * the ones without it; the outlet's runtime inputs are tolerant of both, which
 * is exactly why the docs site renders demos the same way.
 */
function appComponent(importPath: string, componentClass: string, slug: string): string {
  return `import { Component, signal } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { ${componentClass} } from '${importPath}';

@Component({
  selector: 'app-root',
  imports: [NgComponentOutlet],
  template: \`
    <main class="min-h-screen bg-white dark:bg-neutral-950 p-6 sm:p-10">
      <header class="mx-auto mb-8 flex max-w-4xl items-center justify-between gap-4">
        <div>
          <h1 class="m-0 text-lg font-bold text-slate-900 dark:text-white">${slug}</h1>
          <p class="m-0 mt-1 text-xs text-slate-500 dark:text-gray-500">
            Hell's Kitchen UI — edit the component file to play with it.
          </p>
        </div>
        <button type="button" (click)="toggleTheme()"
          class="rounded-lg border border-slate-200 dark:border-white/10 px-3 py-2 text-xs font-semibold
                 text-slate-600 dark:text-gray-400 cursor-pointer">
          {{ dark() ? 'Light' : 'Dark' }}
        </button>
      </header>

      <div class="mx-auto flex max-w-4xl justify-center">
        <ng-container *ngComponentOutlet="demo; inputs: inputs" />
      </div>
    </main>
  \`
})
export class AppComponent {
  readonly demo = ${componentClass};
  // Harmlessly ignored by demos that declare no \`slug\` input.
  readonly inputs = { slug: '${slug}' };

  readonly dark = signal(true);

  toggleTheme(): void {
    this.dark.update((on) => !on);
    document.documentElement.classList.toggle('dark', this.dark());
  }
}
`;
}

function indexHtml(name: string): string {
  return `<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="utf-8" />
    <title>${name} — Hell's Kitchen UI</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
`;
}

const STYLES = `@import "tailwindcss";
@import "primeicons/primeicons.css";

/* The same class-based dark mode the docs site uses, so demo markup written
   against \`dark:\` variants behaves identically here. */
@custom-variant dark (&:where(.dark, .dark *));

body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
  -webkit-font-smoothing: antialiased;
}
`;

const POSTCSS = JSON.stringify({ plugins: { '@tailwindcss/postcss': {} } }, null, 2);

const ANGULAR_JSON = JSON.stringify(
  {
    $schema: './node_modules/@angular/cli/lib/config/schema.json',
    version: 1,
    projects: {
      demo: {
        projectType: 'application',
        root: '',
        sourceRoot: 'src',
        prefix: 'app',
        architect: {
          build: {
            builder: '@angular-devkit/build-angular:application',
            options: {
              browser: 'src/main.ts',
              index: 'src/index.html',
              // Required by the application builder — without it `ng serve`
              // dies on schema validation before it compiles anything.
              outputPath: 'dist/demo',
              // Angular 19 is still zone-based by default. Omitting this
              // builds fine and then renders a blank page, which is a far
              // worse failure than the one above because nothing reports it.
              polyfills: ['zone.js'],
              tsConfig: 'tsconfig.app.json',
              styles: ['src/styles.css']
            }
          },
          serve: {
            builder: '@angular-devkit/build-angular:dev-server',
            options: { buildTarget: 'demo:build' }
          }
        }
      }
    }
  },
  null,
  2
);

const TSCONFIG = JSON.stringify(
  {
    compileOnSave: false,
    compilerOptions: {
      strict: true,
      noImplicitOverride: true,
      noPropertyAccessFromIndexSignature: false,
      skipLibCheck: true,
      isolatedModules: true,
      experimentalDecorators: true,
      moduleResolution: 'bundler',
      importHelpers: true,
      target: 'ES2022',
      module: 'preserve'
    },
    angularCompilerOptions: {
      strictTemplates: true
    }
  },
  null,
  2
);

const TSCONFIG_APP = JSON.stringify(
  {
    extends: './tsconfig.json',
    compilerOptions: { outDir: './out-tsc/app', types: [] },
    files: ['src/main.ts'],
    include: ['src/**/*.d.ts']
  },
  null,
  2
);

function readme(name: string, slug: string, packaged: boolean): string {
  return `# ${name} — Hell's Kitchen UI

This is the live \`${slug}\` demo from [hellskitchen-ui](https://github.com/mat4ixOG/hellskitchen-ui),
lifted out with its real source so you can edit it.

${
  packaged
    ? `**${name} ships in the package.** This sandbox runs the demo that wraps it, and
\`hellskitchen-ui\` is installed here — so you can use the real component directly:

\`\`\`ts
import { Hk${name.replace(/\s+/g, '')}Component } from 'hellskitchen-ui';
\`\`\``
    : `**${name} is a pattern, not a package export.** It is built and documented on the
docs site, and the source in \`src/app/shared/demos/\` *is* the component — copy it
into your own app and change whatever you like. There is nothing to \`npm i\` for
this one, which is why the package is not a dependency of this sandbox.`
}

Run it:

\`\`\`bash
npm install
npm start
\`\`\`
`;
}
