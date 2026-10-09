import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ModuleSummary } from '../../../../core/models/course.model';
import { ModuleRowComponent } from './module-row.component';

const MODULE: ModuleSummary = {
  id: 2,
  slug: 'variables',
  title: 'Variables',
  summary: 'Declarar y nombrar.',
  position: 2,
  published: true,
  lessonCount: 3,
  exerciseCount: 1,
  estimatedMinutes: 30,
};

describe('ModuleRowComponent', () => {
  let fixture: ComponentFixture<ModuleRowComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModuleRowComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ModuleRowComponent);
    fixture.componentRef.setInput('languageSlug', 'java');
    element = fixture.nativeElement as HTMLElement;
  });

  it('links a published module and summarises its content', () => {
    fixture.componentRef.setInput('module', MODULE);
    fixture.detectChanges();

    expect(element.querySelector('a')?.getAttribute('href')).toBe(
      '/languages/java/modules/variables',
    );
    expect(element.querySelector('.module__position')?.textContent).toBe('02');
    expect(element.querySelector('.module__meta')?.textContent).toBe(
      '3 lecciones · 1 ejercicio · 30 min',
    );
  });

  it('marks a finished module as done', () => {
    fixture.componentRef.setInput('module', MODULE);
    fixture.componentRef.setInput('progress', {
      moduleId: 2,
      slug: 'variables',
      completedLessons: 3,
      totalLessons: 3,
      solvedExercises: 1,
      totalExercises: 1,
      completed: true,
    });
    fixture.detectChanges();

    expect(element.querySelector('.check--done')?.getAttribute('aria-label')).toBe(
      'Módulo completado',
    );
  });

  it('does not link an unpublished module', () => {
    fixture.componentRef.setInput('module', { ...MODULE, published: false });
    fixture.detectChanges();

    expect(element.querySelector('a')).toBeNull();
    expect(element.textContent).toContain('Próximamente');
  });
});
