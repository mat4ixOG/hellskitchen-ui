import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ChatLauncherComponent } from './chat-launcher.component';
import { ChatLauncherService } from '../../services/chat-launcher.service';

describe('ChatLauncherComponent', () => {
  let fixture: ComponentFixture<ChatLauncherComponent>;
  let launcher: ChatLauncherService;

  const fab = () => fixture.debugElement.query(By.css('.hk-launcher-fab'));
  const panel = () => fixture.debugElement.query(By.css('.hk-launcher-panel'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ChatLauncherComponent] }).compileComponents();
    fixture = TestBed.createComponent(ChatLauncherComponent);
    launcher = TestBed.inject(ChatLauncherService);
    fixture.detectChanges();
  });

  it('renders nothing at all until something asks for it', () => {
    // Regression: the open/close effects read a counter, and an effect also
    // runs once when created — so the launcher used to open itself on every
    // page load, which baked the button into all 79 prerendered pages.
    expect(fab()).toBeNull();
    expect(panel()).toBeNull();
    expect(launcher.enabled()).toBeFalse();
  });

  it('stays empty through extra change detection', () => {
    fixture.detectChanges();
    fixture.detectChanges();
    expect(fab()).toBeNull();
    expect(launcher.enabled()).toBeFalse();
  });

  it('shows the button and opens when the service is asked', () => {
    launcher.open();
    fixture.detectChanges();

    expect(fab()).not.toBeNull();
    expect(panel()).not.toBeNull();
    expect(launcher.enabled()).toBeTrue();
    expect(launcher.isOpen()).toBeTrue();
  });

  it('takes the button away again on disable', () => {
    launcher.open();
    fixture.detectChanges();
    expect(fab()).not.toBeNull();

    launcher.disable();
    fixture.detectChanges();

    // Not merely closed — gone, so it cannot follow the reader to another page.
    expect(fab()).toBeNull();
    expect(panel()).toBeNull();
  });

  it('keeps the transcript when merely closed', () => {
    launcher.open();
    fixture.detectChanges();
    launcher.close();
    fixture.detectChanges();

    // The panel stays in the DOM, inert, so reopening does not lose the chat.
    expect(panel()).not.toBeNull();
    expect(panel().nativeElement.hasAttribute('inert')).toBeTrue();
    expect(fab()).not.toBeNull();
  });
});
