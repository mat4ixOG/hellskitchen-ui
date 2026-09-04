import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CarouselDemoComponent } from './carousel-demo.component';

describe('CarouselDemoComponent', () => {
  let fixture: ComponentFixture<CarouselDemoComponent>;
  let component: CarouselDemoComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CarouselDemoComponent] }).compileComponents();
    fixture = TestBed.createComponent(CarouselDemoComponent);
    component = fixture.componentInstance;
    // Off by default in the tests: a running timer would make every
    // assertion below a race.
    component.autoplay.set(false);
    fixture.detectChanges();
  });

  it('wraps in both directions when looping', () => {
    component.loop.set(true);
    component.prev();
    expect(component.index()).toBe(component.count() - 1);
    component.next();
    expect(component.index()).toBe(0);
  });

  it('clamps at the ends when not looping', () => {
    component.loop.set(false);
    component.prev();
    expect(component.index()).toBe(0);
    expect(component.prevDisabled()).toBeTrue();

    component.go(component.count() - 1);
    component.next();
    expect(component.index()).toBe(component.count() - 1);
    expect(component.nextDisabled()).toBeTrue();
  });

  it('never disables the arrows while looping', () => {
    component.loop.set(true);
    component.go(0);
    expect(component.prevDisabled()).toBeFalse();
    component.go(component.count() - 1);
    expect(component.nextDisabled()).toBeFalse();
  });

  it('moves the track one full width per slide', () => {
    component.go(2);
    expect(component.offset()).toBe(-200);
  });

  it('suspends autoplay on hover, focus and drag', () => {
    component.autoplay.set(true);
    expect(component.playing()).toBeTrue();

    component.onEnter();
    expect(component.playing()).toBeFalse();
    component.onLeave();
    expect(component.playing()).toBeTrue();

    component.onFocusIn();
    expect(component.playing()).toBeFalse();
    // relatedTarget outside the carousel means focus really left.
    component.onFocusOut({
      relatedTarget: null,
      currentTarget: document.createElement('div')
    } as unknown as FocusEvent);
    expect(component.playing()).toBeTrue();
  });

  it('does not treat focus moving between its own controls as leaving', () => {
    component.autoplay.set(true);
    const root = document.createElement('div');
    const inner = document.createElement('button');
    root.appendChild(inner);

    component.onFocusIn();
    component.onFocusOut({ relatedTarget: inner, currentTarget: root } as unknown as FocusEvent);
    // Still inside, so still suspended.
    expect(component.playing()).toBeFalse();
  });

  it('maps arrow, Home and End keys onto the track', () => {
    const press = (key: string) => {
      const event = new KeyboardEvent('keydown', { key, cancelable: true });
      component.onKey(event);
      return event;
    };

    const right = press('ArrowRight');
    expect(component.index()).toBe(1);
    expect(right.defaultPrevented).toBeTrue();

    press('ArrowLeft');
    expect(component.index()).toBe(0);

    press('End');
    expect(component.index()).toBe(component.count() - 1);

    press('Home');
    expect(component.index()).toBe(0);

    // An unrelated key is left alone for the page to handle.
    const other = press('a');
    expect(other.defaultPrevented).toBeFalse();
  });
});
