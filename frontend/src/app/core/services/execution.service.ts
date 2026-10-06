import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { ExecutionResult } from '../models/execution.model';

@Injectable({ providedIn: 'root' })
export class ExecutionService {
  private readonly http = inject(HttpClient);
  private readonly executionsUrl = `${inject(API_BASE_URL)}/executions`;

  run(sourceCode: string, stdin: string, languageSlug = 'java'): Observable<ExecutionResult> {
    return this.http.post<ExecutionResult>(this.executionsUrl, { languageSlug, sourceCode, stdin });
  }
}
