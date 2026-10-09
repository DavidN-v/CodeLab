import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Language } from '../../../../core/models/language.model';
import { LoadState } from '../../../../core/models/load-state.model';
import { LanguageCatalogComponent } from './language-catalog.component';

function language(slug: string, active: boolean): Language {
  return {
    id: slug.length,
    slug,
    name: slug,
    version: null,
    icon: null,
    tagline: '',
    description: null,
    active,
    category: 'LANGUAGE',
    runnable: true,
  };
}

describe('LanguageCatalogComponent', () => {
  let fixture: ComponentFixture<LanguageCatalogComponent>;
  let element: HTMLElement;

  function render(loadState: LoadState, languages: Language[] = []): void {
    fixture.componentRef.setInput('loadState', loadState);
    fixture.componentRef.setInput('languages', languages);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LanguageCatalogComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(LanguageCatalogComponent);
    element = fixture.nativeElement as HTMLElement;
  });

  it('announces that the catalog is loading', () => {
    render('loading');

    expect(element.querySelector('[role="status"]')?.textContent).toContain('Cargando');
    expect(element.querySelector('.catalog__list')).toBeNull();
  });

  it('renders one row per language, in the given order', () => {
    render('ready', [language('java', true), language('python', false)]);

    const rows = element.querySelectorAll('app-language-list-item');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('java');
    expect(rows[1].textContent).toContain('python');
  });

  it('says so when there are no languages', () => {
    render('ready', []);

    expect(element.textContent).toContain('Todavía no hay lenguajes publicados.');
  });

  it('shows the failure and asks the page to retry', () => {
    const retried = vi.fn();
    fixture.componentInstance.retry.subscribe(retried);
    render('error');

    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    element.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();

    expect(retried).toHaveBeenCalledOnce();
  });
});
