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

  const click = (index: number): void => {
    headers()[index].click();
    fixture.detectChanges();
  };

  it('renders the library accordion with one panel per entry', () => {
    expect(headers().length).toBe(component.panels.length);
    expect(headers()[0].getAttribute('aria-expanded')).toBe('true');
  });

  it('opens exactly one panel in single mode', () => {
    click(1);
    expect(component.open()).toEqual(['tailwind']);
    click(2);
    expect(component.open()).toEqual(['versions']);
  });

  it('stacks panels in multiple mode and collapses back when it is turned off', () => {
    component.setMultiple(true);
    fixture.detectChanges();
    click(1);
    click(2);
    expect(component.open()).toEqual(['free', 'tailwind', 'versions']);

    component.setMultiple(false);
    fixture.detectChanges();
    expect(component.open().length).toBe(1);
  });

  it('expands only the enabled panels', () => {
    component.expandAll();
    fixture.detectChanges();
    expect(component.open()).not.toContain('enterprise');
    expect(component.open().length).toBe(3);
    expect(component.multiple()).toBeTrue();
    component.collapseAll();
    fixture.detectChanges();
    expect(component.open()).toEqual([]);
  });

  it('disables the enterprise header', () => {
    expect(headers()[3].disabled).toBeTrue();
  });
});
