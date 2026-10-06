import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NotFoundPageComponent } from './not-found-page.component';

describe('NotFoundPageComponent', () => {
  it('explains the problem and links back home', async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPageComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(NotFoundPageComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('no existe');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/');
  });
});
