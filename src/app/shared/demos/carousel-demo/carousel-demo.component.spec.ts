import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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

  it('renders one library slide per entry', () => {
    const slides = fixture.debugElement.queryAll(By.css('hk-slide'));
    expect(slides.length).toBe(component.slides.length);
    expect(slides[0].nativeElement.getAttribute('aria-label')).toBe(`1 of ${component.slides.length}`);
  });

  it('wraps when looping, through the two-way bound index', () => {
    component.loop.set(true);
    fixture.detectChanges();
    component.carousel()!.prev();
    expect(component.index()).toBe(component.slides.length - 1);
    component.carousel()!.next();
    expect(component.index()).toBe(0);
  });

  it('clamps and disables the arrows at the ends when the loop control is off', () => {
    component.loop.set(false);
    fixture.detectChanges();
    component.carousel()!.prev();
    expect(component.index()).toBe(0);
    const prev = fixture.debugElement.query(By.css('.hk-carousel-arrow.is-prev')).nativeElement as HTMLButtonElement;
    fixture.detectChanges();
    expect(prev.disabled).toBeTrue();
  });

  it('reports a pause only while autoplay is on and held', () => {
    expect(component.paused()).toBeFalse();
    component.autoplay.set(true);
    fixture.detectChanges();
    component.carousel()!.onEnter();
    expect(component.paused()).toBeTrue();
    component.carousel()!.onLeave();
    expect(component.paused()).toBeFalse();
    component.autoplay.set(false);
    fixture.detectChanges();
  });
});
