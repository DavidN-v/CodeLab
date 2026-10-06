import { HttpClient, HttpContext } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { Language } from '../models/language.model';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly http = inject(HttpClient);
  private readonly languagesUrl = `${inject(API_BASE_URL)}/languages`;

  /** Every language in display order, including the ones not available yet. */
  getLanguages(context?: HttpContext): Observable<Language[]> {
    return this.http.get<Language[]>(this.languagesUrl, { context });
  }

  getLanguage(slug: string, context?: HttpContext): Observable<Language> {
    return this.http.get<Language>(`${this.languagesUrl}/${encodeURIComponent(slug)}`, { context });
  }
}
