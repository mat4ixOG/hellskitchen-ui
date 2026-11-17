import { TestBed } from '@angular/core/testing';
import { HkThemeService } from './hk-theme.service';

describe('HkThemeService', () => {
  const root = document.documentElement;
  let wasDark: boolean;
  let saved: string | null;

  beforeEach(() => {
    wasDark = root.classList.contains('dark');
    saved = localStorage.getItem('hk-theme');
    localStorage.setItem('hk-theme', 'light');
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    root.classList.toggle('dark', wasDark);
    root.style.removeProperty('color-scheme');
    root.style.removeProperty('--hk-accent');
    root.style.removeProperty('--hk-radius');
    if (saved === null) localStorage.removeItem('hk-theme');
    else localStorage.setItem('hk-theme', saved);
  });

  it('restores the stored choice and applies it to the root', () => {
    const service = TestBed.inject(HkThemeService);
    TestBed.flushEffects();
    expect(service.theme()).toBe('light');
    expect(root.classList.contains('dark')).toBeFalse();
    expect(root.style.colorScheme).toBe('light');
  });

  it('toggles and persists', () => {
    const service = TestBed.inject(HkThemeService);
    service.toggle();
    TestBed.flushEffects();
    expect(service.theme()).toBe('dark');
    expect(root.classList.contains('dark')).toBeTrue();
    expect(localStorage.getItem('hk-theme')).toBe('dark');
  });

  it('writes tokens and accents, and ships the 16 presets', () => {
    const service = TestBed.inject(HkThemeService);
    service.setAccent('#3b82f6');
    service.setToken('--hk-radius', '6px');
    expect(root.style.getPropertyValue('--hk-accent')).toBe('#3b82f6');
    expect(root.style.getPropertyValue('--hk-radius')).toBe('6px');
    expect(service.accents.length).toBe(16);
    expect(service.accents[0].name).toBe('Crimson');
  });
});
