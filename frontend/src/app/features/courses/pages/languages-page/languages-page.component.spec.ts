import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Language } from '../../../../core/models/language.model';
import { LanguageService } from '../../../../core/services/language.service';
import { LanguagesPageComponent } from './languages-page.component';

const JAVA: Language = {
  id: 1,
  slug: 'java',
  name: 'Java',
  version: '21',
  icon: 'java',
  tagline: 'Aprende Java.',
  description: 'Orientado a objetos.',
  active: true,
  category: 'LANGUAGE',
  runnable: true,
};

describe('LanguagesPageComponent', () => {
  it('links available languages to their course and marks the rest as upcoming', async () => {
    await TestBed.configureTestingModule({
      imports: [LanguagesPageComponent],
      providers: [
        provideRouter([]),
        {
          provide: LanguageService,
          useValue: {
            getLanguages: () =>
              of([JAVA, { ...JAVA, id: 2, slug: 'python', name: 'Python', active: false }]),
          },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(LanguagesPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.language')).toHaveLength(2);
    expect(element.querySelector('a.language__action')?.getAttribute('href')).toBe(
      '/languages/java',
    );
    expect(element.querySelector('.language--upcoming')?.textContent).toContain('Próximamente');
  });
});
