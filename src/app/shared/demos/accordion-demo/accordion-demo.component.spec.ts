import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AccordionDemoComponent } from './accordion-demo.component';

describe('AccordionDemoComponent', () => {
  let fixture: ComponentFixture<AccordionDemoComponent>;
  let component: AccordionDemoComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [AccordionDemoComponent] }).compileComponents();
    fixture = TestBed.createComponent(AccordionDemoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  const headers = () =>
    fixture.debugElement.queryAll(By.css('button[id^="hk-acc-header-"]'))
      .map((el) => el.nativeElement as HTMLButtonElement);

  it('opens exactly one panel in single mode', () => {
    component.toggle(component.panels[1]);
    expect(component.open()).toEqual(['tailwind']);
    component.toggle(component.panels[2]);
    expect(component.open()).toEqual(['versions']);
  });

  it('closes the last open panel rather than trapping the reader', () => {
    expect(component.isOpen('free')).toBeTrue();
    component.toggle(component.panels[0]);
    expect(component.open()).toEqual([]);
  });

  it('stacks panels in multiple mode', () => {
    component.setMultiple(true);
    component.toggle(component.panels[1]);
    component.toggle(component.panels[2]);
    expect(component.open()).toEqual(['free', 'tailwind', 'versions']);
  });

  it('collapses back to one panel when multiple is turned off', () => {
    component.setMultiple(true);
    component.toggle(component.panels[1]);
    component.toggle(component.panels[2]);
    component.setMultiple(false);
    // Single mode must never be left holding a multi-open state.
    expect(component.open().length).toBe(1);
  });

  it('refuses to open a disabled panel', () => {
    const disabled = component.panels.find((panel) => panel.disabled)!;
    component.toggle(disabled);
    expect(component.isOpen(disabled.id)).toBeFalse();
  });

  it('expands only the enabled panels', () => {
    component.expandAll();
    expect(component.open()).not.toContain('enterprise');
    expect(component.open().length).toBe(3);
    component.collapseAll();
    expect(component.open()).toEqual([]);
  });

  it('wraps arrow-key focus and skips the disabled header', () => {
    const all = headers();
    // The disabled header is not focusable, so the ring is the other three.
    all[0].focus();
    component.onKey(new KeyboardEvent('keydown', { key: 'ArrowUp' }), component.panels[0]);
    // Wrapping up from the first lands on the last *enabled* one.
    expect(document.activeElement?.id).toBe('hk-acc-header-versions');

    component.onKey(new KeyboardEvent('keydown', { key: 'ArrowDown' }), component.panels[2]);
    expect(document.activeElement?.id).toBe('hk-acc-header-free');

    component.onKey(new KeyboardEvent('keydown', { key: 'End' }), component.panels[0]);
    expect(document.activeElement?.id).toBe('hk-acc-header-versions');
  });

  it('wires aria-expanded and aria-controls both ways', () => {
    const first = headers()[0];
    expect(first.getAttribute('aria-expanded')).toBe('true');
    const controls = first.getAttribute('aria-controls')!;
    const region = fixture.debugElement.query(By.css(`#${controls}`)).nativeElement as HTMLElement;
    expect(region.getAttribute('aria-labelledby')).toBe(first.id);
  });

  it('marks a closed panel inert so its content leaves the tab order', () => {
    const controls = headers()[1].getAttribute('aria-controls')!;
    const region = fixture.debugElement.query(By.css(`#${controls}`)).nativeElement as HTMLElement;
    expect(region.hasAttribute('inert')).toBeTrue();
  });
});
