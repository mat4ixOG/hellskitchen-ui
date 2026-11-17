import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { HkToastHostComponent } from './hk-toast-host.component';
import { HkToastService } from './hk-toast.service';

@Component({
  imports: [HkToastHostComponent],
  template: `<hk-toast-host position="inline" [max]="2" />`
})
class HostComponent {}

describe('HkToastHostComponent + HkToastService', () => {
  let fixture: ComponentFixture<HostComponent>;
  let service: HkToastService;
  const toasts = () => fixture.debugElement.queryAll(By.css('.hk-toast'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    service = TestBed.inject(HkToastService);
    fixture.detectChanges();
  });

  afterEach(() => service.clear());

  it('renders a pushed toast with its tone and copy', () => {
    const id = service.push({ tone: 'danger', title: 'Build failed', body: 'Two type errors.', duration: 0 });
    fixture.detectChanges();
    expect(typeof id).toBe('string');
    const el = toasts()[0].nativeElement as HTMLElement;
    expect(el.getAttribute('data-tone')).toBe('danger');
    expect(el.getAttribute('role')).toBe('alert');
    expect(el.textContent).toContain('Build failed');
    expect(el.textContent).toContain('Two type errors.');
  });

  it('defaults the tone to info', () => {
    service.push({ title: 'Heads up', duration: 0 });
    fixture.detectChanges();
    expect(toasts()[0].nativeElement.getAttribute('data-tone')).toBe('info');
  });

  it('caps the stack at max, dropping the oldest', () => {
    service.push({ title: 'one', duration: 0 });
    service.push({ title: 'two', duration: 0 });
    service.push({ title: 'three', duration: 0 });
    fixture.detectChanges();
    expect(toasts().map((t) => t.nativeElement.querySelector('.hk-toast-title').textContent)).toEqual([
      'two',
      'three'
    ]);
  });

  it('dismisses from the button and through the service', () => {
    const id = service.push({ title: 'one', duration: 0 });
    service.push({ title: 'two', duration: 0 });
    service.dismiss(id);
    fixture.detectChanges();
    expect(toasts().length).toBe(1);
    fixture.debugElement.query(By.css('.hk-toast-dismiss')).nativeElement.click();
    fixture.detectChanges();
    expect(toasts().length).toBe(0);
  });

  it('runs the action and closes the toast', () => {
    let ran = false;
    service.push({ title: 'Deployed', duration: 0, action: { label: 'View log', run: () => (ran = true) } });
    fixture.detectChanges();
    fixture.debugElement.query(By.css('.hk-toast-action')).nativeElement.click();
    fixture.detectChanges();
    expect(ran).toBeTrue();
    expect(toasts().length).toBe(0);
  });

  it('auto-dismisses after its duration, and pauses while hovered', fakeAsync(() => {
    service.push({ title: 'timed', duration: 1000 });
    fixture.detectChanges();
    tick(500);
    fixture.debugElement.nativeElement.querySelector('hk-toast-host').dispatchEvent(new Event('mouseenter'));
    tick(2000);
    fixture.detectChanges();
    expect(toasts().length).toBe(1);
    fixture.debugElement.nativeElement.querySelector('hk-toast-host').dispatchEvent(new Event('mouseleave'));
    tick(600);
    fixture.detectChanges();
    expect(toasts().length).toBe(0);
  }));
});
