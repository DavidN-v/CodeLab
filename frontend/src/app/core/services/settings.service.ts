import { DOCUMENT } from '@angular/common';
import { Injectable, effect, inject, signal } from '@angular/core';

import { readStorage, writeStorage } from './browser-storage';

export type Theme = 'dark' | 'light';

const THEME_KEY = 'forja.theme';
const FONT_KEY = 'forja.editorFont';

/** Editor font sizes on offer, in pixels. */
export const EDITOR_FONT_SIZES = [12, 14, 16, 18, 20] as const;

/**
 * Per-device preferences: colour theme and code font size. They live in the
 * browser, apply to the whole document and survive reloads.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly document = inject(DOCUMENT);

  readonly theme = signal<Theme>(initialTheme());
  readonly editorFontSize = signal<number>(initialFontSize());

  constructor() {
    effect(() => {
      const theme = this.theme();
      this.document.documentElement.dataset['theme'] = theme;
      writeStorage(THEME_KEY, theme);
    });
    effect(() => {
      const size = this.editorFontSize();
      this.document.documentElement.style.setProperty('--editor-font-size', `${size}px`);
      writeStorage(FONT_KEY, String(size));
    });
  }

  toggleTheme(): void {
    this.theme.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
  }

  changeFontSize(step: 1 | -1): void {
    const sizes: readonly number[] = EDITOR_FONT_SIZES;
    const index = sizes.indexOf(this.editorFontSize());
    const next = sizes[Math.max(0, Math.min(sizes.length - 1, (index < 0 ? 1 : index) + step))];
    this.editorFontSize.set(next);
  }
}

function initialTheme(): Theme {
  const stored = readStorage(THEME_KEY);
  if (stored === 'dark' || stored === 'light') {
    return stored;
  }
  return globalThis.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function initialFontSize(): number {
  const stored = Number(readStorage(FONT_KEY));
  return (EDITOR_FONT_SIZES as readonly number[]).includes(stored) ? stored : 14;
}
