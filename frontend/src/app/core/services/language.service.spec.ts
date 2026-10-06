import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config/api.config';
import { Language } from '../models/language.model';
import { LanguageService } from './language.service';

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

describe('LanguageService', () => {
  let service: LanguageService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'https://api.test/v1' },
      ],
    });
    service = TestBed.inject(LanguageService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('requests the language list from the configured API root', () => {
    let received: Language[] | undefined;
    service.getLanguages().subscribe((languages) => (received = languages));

    const request = http.expectOne('https://api.test/v1/languages');
    expect(request.request.method).toBe('GET');
    request.flush([JAVA]);

    expect(received).toEqual([JAVA]);
  });

  it('requests a single language by slug, escaping it', () => {
    service.getLanguage('c#').subscribe();

    http.expectOne('https://api.test/v1/languages/c%23').flush(JAVA);
  });
});
