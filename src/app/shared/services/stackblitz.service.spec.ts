import { TestBed } from '@angular/core/testing';
import { StackblitzService } from './stackblitz.service';

describe('StackblitzService', () => {
  let service: StackblitzService;
  let submitted: Record<string, string>;
  let action: string;

  const SOURCE = {
    slug: 'accordion',
    entry: 'src/app/shared/demos/accordion-demo/accordion-demo.component',
    componentClass: 'AccordionDemoComponent',
    files: {
      'src/app/shared/demos/accordion-demo/accordion-demo.component.ts': 'export class AccordionDemoComponent {}',
      'src/app/shared/demos/accordion-demo/accordion-demo.component.html': '<div></div>'
    }
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StackblitzService);
    submitted = {};
    action = '';

    spyOn(window, 'fetch').and.returnValue(
      Promise.resolve({ ok: true, json: () => Promise.resolve(SOURCE) } as Response)
    );

    // Intercept the hand-off rather than actually navigating to StackBlitz.
    spyOn(HTMLFormElement.prototype, 'submit').and.callFake(function (this: HTMLFormElement) {
      action = this.action;
      for (const field of Array.from(this.querySelectorAll('input'))) {
        submitted[field.name] = field.value;
      }
    });
  });

  const fileOf = (path: string) => submitted[`project[files][${path}]`];

  it('sends the demo source alongside a runnable Angular shell', async () => {
    await service.open('accordion', 'Accordion', false);

    // The demo's own files, at their real paths.
    expect(fileOf('src/app/shared/demos/accordion-demo/accordion-demo.component.ts')).toContain(
      'AccordionDemoComponent'
    );
    expect(fileOf('src/app/shared/demos/accordion-demo/accordion-demo.component.html')).toBe('<div></div>');

    // The shell needed to boot.
    for (const path of [
      'package.json',
      'angular.json',
      'tsconfig.json',
      'tsconfig.app.json',
      'src/index.html',
      'src/main.ts',
      'src/styles.css',
      'src/app/app.component.ts'
    ]) {
      expect(fileOf(path)).withContext(path).toBeTruthy();
    }
    expect(submitted['project[template]']).toBe('node');
  });

  it('emits a build config the Angular CLI will actually accept', async () => {
    // Both of these were missing and both were found by generating a project
    // and running it: `outputPath` fails schema validation before compiling,
    // and a missing `polyfills` builds cleanly then renders a blank page.
    await service.open('accordion', 'Accordion', false);
    const options = JSON.parse(fileOf('angular.json')).projects.demo.architect.build.options;
    expect(options.outputPath).toBeTruthy();
    expect(options.polyfills).toContain('zone.js');
    expect(options.browser).toBe('src/main.ts');
    expect(options.tsConfig).toBe('tsconfig.app.json');
  });

  it('imports the demo by a path that resolves from src/app', async () => {
    await service.open('accordion', 'Accordion', false);
    const app = fileOf('src/app/app.component.ts');
    // Relative to src/app/app.component.ts, not the repo root.
    expect(app).toContain("from './shared/demos/accordion-demo/accordion-demo.component'");
    expect(app).not.toContain("from './src/app/");
  });

  it('opens on the demo file rather than the generated boilerplate', async () => {
    await service.open('accordion', 'Accordion', false);
    expect(decodeURIComponent(action)).toContain(
      'file=src/app/shared/demos/accordion-demo/accordion-demo.component.ts'
    );
  });

  it('omits the library when the demo does not import it', async () => {
    // Regression: the package was added to every sandbox. Only four demos
    // import it, and for the other sixty-five `npm install` failed outright
    // with ETARGET whenever the pinned version was not on the registry yet.
    await service.open('accordion', 'Accordion', false);
    const pkg = JSON.parse(fileOf('package.json'));
    expect(pkg.dependencies['hellskitchen-ui']).toBeUndefined();
    expect(pkg.scripts.start).toBe('ng serve');
  });

  it('includes the library, by dist-tag, when the demo does import it', async () => {
    (window.fetch as jasmine.Spy).and.returnValue(
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            slug: 'table',
            entry: 'src/app/shared/demos/table-demo/table-demo.component',
            componentClass: 'TableDemoComponent',
            files: {
              'src/app/shared/demos/table-demo/table-demo.component.ts':
                "import { HkTableComponent } from 'hellskitchen-ui';"
            }
          })
      } as Response)
    );

    await service.open('table', 'Table', true);
    const pkg = JSON.parse(fileOf('package.json'));
    // A pinned range resolves against npm, not this repo, so it breaks while
    // the local version is ahead of the published one. A tag always exists.
    expect(pkg.dependencies['hellskitchen-ui']).toBe('latest');
  });

  it('tells a pattern reader there is nothing to import', async () => {
    await service.open('accordion', 'Accordion', false);
    expect(fileOf('README.md')).toContain('not a package export');
  });

  it('tells a packaged reader the real component is available', async () => {
    await service.open('table', 'Table', true);
    expect(fileOf('README.md')).toContain('ships in the package');
  });

  it('renders through NgComponentOutlet so slug-taking demos still work', async () => {
    await service.open('accordion', 'Accordion', false);
    const app = fileOf('src/app/app.component.ts');
    // Backgrounds share one stage component and need [slug]; most demos have
    // no such input, and a static binding would not compile for them.
    expect(app).toContain('ngComponentOutlet');
    expect(app).toContain("slug: 'accordion'");
  });

  it('reports a failure instead of opening an empty tab', async () => {
    (window.fetch as jasmine.Spy).and.returnValue(
      Promise.resolve({ ok: false, status: 404 } as Response)
    );
    await service.open('nope', 'Nope', false);
    expect(service.error()).toContain('Could not build');
    expect(HTMLFormElement.prototype.submit).not.toHaveBeenCalled();
  });

  it('fetches a given demo only once', async () => {
    await service.open('accordion', 'Accordion', false);
    await service.open('accordion', 'Accordion', false);
    expect((window.fetch as jasmine.Spy).calls.count()).toBe(1);
  });

  it('clears busy when it is done', async () => {
    await service.open('accordion', 'Accordion', false);
    expect(service.busy()).toBeNull();
  });
});
