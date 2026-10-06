import { TestBed } from '@angular/core/testing';

import { BRAND } from '../../core/config/brand.config';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  it('shows the brand and the current year', async () => {
    await TestBed.configureTestingModule({ imports: [FooterComponent] }).compileComponents();
    const fixture = TestBed.createComponent(FooterComponent);
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain(BRAND.name);
    expect(text).toContain(BRAND.tagline);
    expect(text).toContain(String(new Date().getFullYear()));
  });
});
