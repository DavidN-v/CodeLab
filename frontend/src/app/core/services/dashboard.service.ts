import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { Dashboard } from '../models/dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly dashboardUrl = `${inject(API_BASE_URL)}/dashboard`;

  /** Days and streaks are counted in the browser's time zone. */
  getDashboard(timezone = Intl.DateTimeFormat().resolvedOptions().timeZone): Observable<Dashboard> {
    return this.http.get<Dashboard>(this.dashboardUrl, { params: { timezone } });
  }
}
