import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';

import { AppError } from '../../../../core/models/api-error.model';
import { Language } from '../../../../core/models/language.model';
import { LanguageService } from '../../../../core/services/language.service';
import { HomePageComponent } from './home-page.component';

const PYTHON: Language = {
  id: 2,
  slug: 'python',
  name: 'Python',
  version: '3.13',
  icon: null,
  tagline: 'Sintaxis clara.',
  description: null,
  active: false,
};
const JAVA: Language = {
  ...PYTHON,
  id: 1,
  slug: 'java',
  name: 'Java',
  version: '21',
  active: true,
};

describe('HomePageComponent', () => {
  let fixture: ComponentFixture<HomePageComponent>;
  let element: HTMLElement;
  let getLanguages: ReturnType<typeof vi.fn<() => Observable<Language[]>>>;

  async function render(): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [HomePageComponent],
      providers: [provideRouter([]), { provide: LanguageService, useValue: { getLanguages } }],
    }).compileComponents();

    fixture = TestBed.createComponent(HomePageComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  }

  beforeEach(() => {
    getLanguages = vi.fn<() => Observable<Language[]>>();
  });

  it('lists the catalog and features the first available language', async () => {
    getLanguages.mockReturnValue(of([PYTHON, JAVA]));
    await render();

    expect(element.querySelectorAll('app-language-list-item')).toHaveLength(2);
    expect(element.querySelector('.hero__actions .button--primary')?.textContent).toContain(
      'Comenzar con Java',
    );
  });

  it('shows the failure inline and reloads on retry', async () => {
    getLanguages.mockReturnValue(
      throwError(() => new AppError(0, 'NETWORK_ERROR', 'Sin conexión')),
    );
    await render();
    expect(element.querySelector('[role="alert"]')).not.toBeNull();
    expect(element.querySelector('.hero__actions .button--primary')).toBeNull();

    getLanguages.mockReturnValue(of([JAVA]));
    element.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    fixture.detectChanges();

    expect(getLanguages).toHaveBeenCalledTimes(2);
    expect(element.querySelector('[role="alert"]')).toBeNull();
    expect(element.querySelectorAll('app-language-list-item')).toHaveLength(1);
  });
});
