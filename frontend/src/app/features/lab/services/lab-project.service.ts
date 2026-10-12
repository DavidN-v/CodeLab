import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import { readStorage, removeStorage, writeStorage } from '../../../core/services/browser-storage';
import {
  EMPTY_CONTENT,
  LabContent,
  LabMode,
  LabProject,
  LabProjectSummary,
  LabVersion,
} from '../models/lab.models';

/** How the API stores a project: metadata plus the content as one JSON string. */
interface ProjectDto {
  id: number;
  name: string;
  description: string;
  mode: 'FREE' | 'TUTOR' | 'CHALLENGE' | 'DEBUG';
  content: string;
  folder: string;
  updatedAt: string;
}

type SummaryDto = Omit<ProjectDto, 'content'>;

const DRAFT_KEY = 'forja.lab.draft';
const LAST_PROJECT_KEY = 'forja.lab.last';

/**
 * Where lab projects live. Signed in, they are saved in the learner's account
 * through the API. The browser only keeps a draft of the project being edited,
 * so a reload or a lost connection does not lose work; it is not a second
 * place where projects are stored.
 */
@Injectable({ providedIn: 'root' })
export class LabProjectService {
  private readonly http = inject(HttpClient);
  private readonly url = `${inject(API_BASE_URL)}/lab/projects`;

  list(): Observable<LabProjectSummary[]> {
    return this.http.get<SummaryDto[]>(this.url).pipe(map((items) => items.map(toSummary)));
  }

  open(id: number): Observable<LabProject> {
    return this.http.get<ProjectDto>(`${this.url}/${id}`).pipe(map(toProject));
  }

  /** Creates the project the first time and updates it afterwards. */
  save(project: LabProject): Observable<LabProject> {
    const body = {
      name: project.name.trim() || 'Proyecto sin nombre',
      description: project.description,
      mode: project.mode.toUpperCase(),
      content: JSON.stringify(contentOf(project)),
      folder: project.folder,
    };
    const request =
      project.id === null
        ? this.http.post<ProjectDto>(this.url, body)
        : this.http.put<ProjectDto>(`${this.url}/${project.id}`, body);
    return request.pipe(map(toProject));
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  /** Moves a saved project to a folder; an empty name takes it out of any folder. */
  move(id: number, folder: string): Observable<LabProjectSummary> {
    return this.http.put<SummaryDto>(`${this.url}/${id}/folder`, { folder }).pipe(map(toSummary));
  }

  duplicate(id: number): Observable<LabProject> {
    return this.http.post<ProjectDto>(`${this.url}/${id}/duplicate`, {}).pipe(map(toProject));
  }

  versions(id: number): Observable<LabVersion[]> {
    return this.http.get<LabVersion[]>(`${this.url}/${id}/versions`);
  }

  saveVersion(id: number, label: string): Observable<LabVersion> {
    return this.http.post<LabVersion>(`${this.url}/${id}/versions`, { label });
  }

  restoreVersion(id: number, versionId: number): Observable<LabProject> {
    return this.http
      .post<ProjectDto>(`${this.url}/${id}/versions/${versionId}/restore`, {})
      .pipe(map(toProject));
  }

  // --- The draft kept in this browser ---------------------------------------

  readDraft(): LabProject | null {
    const stored = readStorage(DRAFT_KEY);
    if (!stored) {
      return null;
    }
    try {
      const draft = JSON.parse(stored) as Partial<LabProject>;
      if (!Array.isArray(draft.files) || draft.files.length === 0) {
        return null;
      }
      return {
        ...EMPTY_CONTENT,
        ...draft,
        id: typeof draft.id === 'number' ? draft.id : null,
        name: draft.name ?? 'Proyecto sin nombre',
        description: draft.description ?? '',
        mode: draft.mode ?? 'free',
        folder: draft.folder ?? '',
      } as LabProject;
    } catch {
      return null;
    }
  }

  writeDraft(project: LabProject): void {
    writeStorage(DRAFT_KEY, JSON.stringify(project));
  }

  clearDraft(): void {
    removeStorage(DRAFT_KEY);
  }

  /** The saved project the learner was last working on, to reopen it next time. */
  lastProjectId(): number | null {
    const id = Number(readStorage(LAST_PROJECT_KEY));
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  rememberProject(id: number | null): void {
    if (id === null) {
      removeStorage(LAST_PROJECT_KEY);
    } else {
      writeStorage(LAST_PROJECT_KEY, String(id));
    }
  }
}

function contentOf(project: LabProject): LabContent {
  return {
    idea: project.idea,
    files: project.files,
    tests: project.tests,
    plan: project.plan,
    doneSteps: project.doneSteps,
    catalogId: project.catalogId,
  };
}

function toSummary(dto: SummaryDto): LabProjectSummary {
  return { ...dto, folder: dto.folder ?? '', mode: dto.mode.toLowerCase() as LabMode };
}

function toProject(dto: ProjectDto): LabProject {
  let content: Partial<LabContent> = {};
  try {
    content = JSON.parse(dto.content) as Partial<LabContent>;
  } catch {
    // A project whose content cannot be read opens empty rather than not at all.
  }
  return {
    ...EMPTY_CONTENT,
    ...content,
    files: Array.isArray(content.files) ? content.files : [],
    tests: Array.isArray(content.tests) ? content.tests : [],
    doneSteps: Array.isArray(content.doneSteps) ? content.doneSteps : [],
    id: dto.id,
    name: dto.name,
    description: dto.description,
    mode: dto.mode.toLowerCase() as LabMode,
    folder: dto.folder ?? '',
  };
}
