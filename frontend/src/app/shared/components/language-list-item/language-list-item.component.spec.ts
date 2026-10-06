import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Language } from '../../../core/models/language.model';
import { LanguageListItemComponent } from './language-list-item.component';

const JAVA: Language = {
  id: 1,
  slug: 'java',
  name: 'Java',
  version: '21',
  icon: 'java',
  tagline: 'Aprende Java desde cero.',
  description: null,
  active: true,
};

describe('LanguageListItemComponent', () => {
  let fixture: ComponentFixture<LanguageListItemComponent>;
  let element: HTMLElement;

  function render(language: Language): void {
    fixture.componentRef.setInput('language', language);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageListItemComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageListItemComponent);
    element = fixture.nativeElement as HTMLElement;
  });

  it('links an available language to its page', () => {
    render(JAVA);

    const link = element.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/languages/java');
    expect(link?.textContent).toContain('Java');
    expect(link?.querySelector('.language__version')?.textContent).toBe('21');
    expect(link?.textContent).toContain('Disponible');
  });

  it('shows an upcoming language without a link', () => {
    render({ ...JAVA, slug: 'python', name: 'Python', active: false });

    expect(element.querySelector('a')).toBeNull();
    expect(element.textContent).toContain('Python');
    expect(element.textContent).toContain('Próximamente');
  });

  it('omits the version when the language has none', () => {
    render({ ...JAVA, version: null });

    expect(element.querySelector('.language__version')).toBeNull();
  });
});
