import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkCarouselComponent, HkCarouselSlideComponent } from './hk-carousel.component';

@Component({
  imports: [HkCarouselComponent, HkCarouselSlideComponent],
  template: `
    <hk-carousel aria-label="Highlights" [(index)]="slide" [autoplay]="autoplay()" [loop]="loop()"
      (changed)="changes.push($event)">
      @for (item of items; track item) {
        <hk-slide>{{ item }}</hk-slide>
      }
    </hk-carousel>
  `
})
class HostComponent {
  readonly items = ['one', 'two', 'three'];
  readonly slide = signal(0);
  readonly autoplay = signal(false);
  readonly loop = signal(true);
  readonly carousel = viewChild.required(HkCarouselComponent);
  changes: number[] = [];
}

describe('HkCarouselComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let carousel: HkCarouselComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    carousel = host.carousel();
  });

  it('labels each slide and hides the off-screen ones', () => {
    const slides = fixture.debugElement.queryAll(By.css('hk-slide')).map((el) => el.nativeElement as HTMLElement);
    expect(slides.length).toBe(3);
    expect(slides[0].getAttribute('aria-label')).toBe('1 of 3');
    expect(slides[0].hasAttribute('inert')).toBeFalse();
    expect(slides[1].hasAttribute('inert')).toBeTrue();
  });

  it('wraps in both directions when looping and two-way binds the index', () => {
    carousel.prev();
    fixture.detectChanges();
    expect(host.slide()).toBe(2);
    expect(host.changes).toEqual([2]);
    carousel.next();
    expect(host.slide()).toBe(0);
  });

  it('clamps and disables the arrows at the ends when not looping', () => {
    host.loop.set(false);
    fixture.detectChanges();
    carousel.prev();
    expect(carousel.index()).toBe(0);
    expect(carousel.prevDisabled()).toBeTrue();
    carousel.go(5);
    expect(carousel.index()).toBe(2);
    expect(carousel.nextDisabled()).toBeTrue();
  });

  it('moves the track one full width per slide', () => {
    carousel.go(2);
    expect(carousel.offset()).toBe(-200);
  });

  it('suspends autoplay on hover and focus', () => {
    host.autoplay.set(true);
    fixture.detectChanges();
    expect(carousel.playing()).toBeTrue();
    carousel.onEnter();
    expect(carousel.playing()).toBeFalse();
    carousel.onLeave();
    carousel.onFocusIn();
    expect(carousel.playing()).toBeFalse();
    carousel.onFocusOut({ relatedTarget: null, currentTarget: document.createElement('div') } as unknown as FocusEvent);
    expect(carousel.playing()).toBeTrue();
  });

  it('maps arrow, Home and End keys onto the track', () => {
    const press = (key: string): KeyboardEvent => {
      const event = new KeyboardEvent('keydown', { key, cancelable: true });
      carousel.onKey(event);
      return event;
    };
    expect(press('ArrowRight').defaultPrevented).toBeTrue();
    expect(carousel.index()).toBe(1);
    press('End');
    expect(carousel.index()).toBe(2);
    press('Home');
    expect(carousel.index()).toBe(0);
    expect(press('a').defaultPrevented).toBeFalse();
  });
});
