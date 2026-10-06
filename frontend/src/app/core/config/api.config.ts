import { InjectionToken } from '@angular/core';

import { environment } from '../../../environments/environment';

/** Root of the REST API. Services build their URLs from this token only. */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});
