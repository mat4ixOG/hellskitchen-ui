import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HkAvatarComponent } from './hk-avatar.component';
import { HkAvatarStackComponent } from './hk-avatar-stack.component';

@Component({
  imports: [HkAvatarComponent, HkAvatarStackComponent],
  template: `
    <hk-avatar id="solo" name="Debashish Roy" [src]="src()" [online]="true" />
    <hk-avatar-stack [max]="2">
      @for (name of people; track name) {
        <hk-avatar size="sm" [name]="name" />
      }
    </hk-avatar-stack>
  `
})
class HostComponent {
  readonly src = signal('');
  readonly people = ['Aisha Khan', 'Marco Silva', 'Lena Fischer', 'Yuki Tanaka'];
}

describe('HkAvatarComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const el = (selector: string): HTMLElement => fixture.nativeElement.querySelector(selector);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('derives initials and names the face', () => {
    expect(el('#solo .hk-avatar-face').textContent?.trim()).toBe('DR');
    expect(el('#solo .hk-avatar-face').getAttribute('aria-label')).toBe('Debashish Roy');
    expect(el('#solo .hk-avatar-presence')).toBeTruthy();
    expect(el('#solo .hk-sr').textContent).toContain('online');
  });

  it('falls back to initials when the image fails', () => {
    host.src.set('/missing.png');
    fixture.detectChanges();
    const img = el('#solo img');
    expect(img).toBeTruthy();
    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(el('#solo img')).toBeNull();
    expect(el('#solo .hk-avatar-face').textContent?.trim()).toBe('DR');
  });

  it('collapses a stack past max and expands on the +N', () => {
    const stacked = (): HTMLElement[] =>
      Array.from(fixture.nativeElement.querySelectorAll('hk-avatar-stack hk-avatar'));
    const visible = (): number => stacked().filter((a) => a.style.display !== 'none').length;
    expect(visible()).toBe(2);
    const more = el('.hk-avatar-more') as HTMLButtonElement;
    expect(more.textContent?.trim()).toBe('+2');
    more.click();
    fixture.detectChanges();
    expect(visible()).toBe(4);
    expect(el('.hk-avatar-more')).toBeNull();
  });
});
