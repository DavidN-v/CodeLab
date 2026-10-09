import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Dashboard } from '../../../../core/models/dashboard.model';
import { DashboardService } from '../../../../core/services/dashboard.service';
import { DashboardPageComponent } from './dashboard-page.component';

const DASHBOARD: Dashboard = {
  user: { id: 1, email: 'ada@example.com', displayName: 'Ada', dailyGoalXp: 30 },
  xp: 175,
  level: { number: 2, title: 'Iniciado', currentLevelXp: 100, nextLevelXp: 250 },
  streak: { current: 3, longest: 5, activeToday: true },
  totals: { lessonsCompleted: 8, exercisesSolved: 4, submissions: 9, learningMinutes: 95 },
  activity: Array.from({ length: 84 }, (_, index) => ({ date: '2026-10-01', count: index % 3 })),
  courses: [
    {
      course: {
        id: 1,
        slug: 'java-desde-cero',
        title: 'Java desde cero',
        languageSlug: 'java',
        languageName: 'Java',
      },
      percent: 12,
      completedLessons: 8,
      totalLessons: 80,
      solvedExercises: 4,
      totalExercises: 75,
      currentModule: { id: 2, slug: 'variables', title: 'Variables', position: 2 },
      nextLesson: {
        id: 9,
        slug: 'declarar',
        title: 'Declarar variables',
        moduleSlug: 'variables',
        moduleTitle: 'Variables',
      },
      nextStep: {
        kind: 'LESSON',
        slug: 'declarar',
        title: 'Declarar variables',
        moduleSlug: 'variables',
        moduleTitle: 'Variables',
        modulePosition: 2,
      },
    },
  ],
  recentSubmissions: [
    {
      exerciseSlug: 'hola-mundo',
      exerciseTitle: 'Hola, mundo',
      status: 'ACCEPTED',
      passedTests: 1,
      totalTests: 1,
      createdAt: new Date().toISOString(),
    },
  ],
  achievements: [
    { code: 'first-lesson', title: 'Primera chispa', description: '', earned: true },
    { code: 'streak-7', title: 'Una semana en la fragua', description: '', earned: false },
  ],
  dailyGoal: { goalXp: 30, todayXp: 20 },
  reviews: [
    {
      exerciseSlug: 'hola-mundo',
      exerciseTitle: 'Hola, mundo',
      moduleTitle: 'Fundamentos',
      solvedAt: '2026-10-01T10:00:00Z',
    },
  ],
  reviewsDue: 1,
};

describe('DashboardPageComponent', () => {
  it('summarises level, streak, courses, activity and achievements', async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPageComponent],
      providers: [
        provideRouter([]),
        { provide: DashboardService, useValue: { getDashboard: () => of(DASHBOARD) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(DashboardPageComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toContain('Ada');
    expect(element.querySelector('.level')?.textContent).toContain('75 para el siguiente nivel');
    expect(
      element.querySelector('.level [role="progressbar"]')?.getAttribute('aria-valuenow'),
    ).toBe('50');
    expect(element.querySelector('.streak__value')?.textContent).toContain('3 días');
    expect(element.querySelector('.course-card__action')?.getAttribute('href')).toBe(
      '/learn/java/variables/declarar',
    );
    expect(element.textContent).toContain('1.6 h');
    expect(element.querySelectorAll('.achievement--earned')).toHaveLength(1);
    expect(element.querySelector('app-activity-heatmap')).not.toBeNull();
    expect(element.querySelector('.goal__numbers')?.textContent).toContain('20 / 30 XP');
    expect(element.querySelector('.reviews a')?.getAttribute('href')).toBe('/practice/hola-mundo');
  });
});
