import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  HkCardBodyDirective,
  HkCardComponent,
  HkCardFooterDirective,
  HkCardHeaderDirective,
  HkCardMediaDirective
} from './hk-card.component';

@Component({
  imports: [HkCardComponent, HkCardMediaDirective, HkCardHeaderDirective, HkCardBodyDirective, HkCardFooterDirective],
  template: `
    <hk-card [interactive]="interactive()" (activated)="activations = activations + 1">
      @if (media()) { <div hkCardMedia class="m">media</div> }
      @if (header()) { <div hkCardHeader>header</div> }
      @if (body()) { <p hkCardBody>body</p> }
      <div hkCardFooter>footer</div>
    </hk-card>
  `
})
class HostComponent {
  readonly media = signal(true);
  readonly header = signal(true);
  readonly body = signal(true);
  readonly interactive = signal(false);
  activations = 0;
}

describe('HkCardComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const card = (): HTMLElement => fixture.debugElement.query(By.css('hk-card')).nativeElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders every filled slot', () => {
    expect(card().querySelector('.hk-card-media')).toBeTruthy();
    expect(card().querySelector('.hk-card-header')).toBeTruthy();
    expect(card().querySelector('.hk-card-body')).toBeTruthy();
    expect(card().querySelector('.hk-card-footer.is-ruled')).toBeTruthy();
  });

  it('drops the wrapper and the rule of an empty slot', () => {
    host.media.set(false);
    host.header.set(false);
    host.body.set(false);
    fixture.detectChanges();
    expect(card().querySelector('.hk-card-media')).toBeNull();
    expect(card().querySelector('.hk-card-header')).toBeNull();
    expect(card().querySelector('.hk-card-footer.is-ruled')).toBeNull();
    expect(card().querySelector('.hk-card-footer')).toBeTruthy();
  });

  it('only activates when interactive', () => {
    card().click();
    expect(host.activations).toBe(0);
    host.interactive.set(true);
    fixture.detectChanges();
    expect(card().getAttribute('tabindex')).toBe('0');
    card().click();
    card().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(host.activations).toBe(2);
  });
});
