import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuizQuestion } from '../../../../core/models/course.model';
import { LessonQuizComponent, sameOutput } from './lesson-quiz.component';

const QUESTIONS: QuizQuestion[] = [
  {
    type: 'CHOICE',
    prompt: '¿Qué guarda un int?',
    code: null,
    options: ['Un entero', 'Un texto'],
    correctOption: 0,
    expectedOutput: null,
    input: null,
    explanation: 'Los int guardan enteros.',
  },
  {
    type: 'OUTPUT',
    prompt: '¿Qué imprime?',
    code: 'public class Main { public static void main(String[] a) { System.out.println(7); } }',
    options: null,
    correctOption: null,
    expectedOutput: '7\n',
    input: '',
    explanation: 'Imprime el número.',
  },
];

describe('LessonQuizComponent', () => {
  let fixture: ComponentFixture<LessonQuizComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LessonQuizComponent] }).compileComponents();
    fixture = TestBed.createComponent(LessonQuizComponent);
    fixture.componentRef.setInput('questions', QUESTIONS);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('grades each answer, explains it and reports the score at the end', () => {
    const finished: number[] = [];
    fixture.componentInstance.finished.subscribe((score) => finished.push(score));

    element.querySelectorAll<HTMLButtonElement>('.option')[1].click();
    fixture.detectChanges();
    expect(element.querySelector('.question__verdict')?.textContent).toContain('No exactamente');
    expect(element.textContent).toContain('Los int guardan enteros.');

    const answer = element.querySelector<HTMLTextAreaElement>('.question__answer')!;
    answer.value = '7';
    answer.dispatchEvent(new Event('input'));
    Array.from(element.querySelectorAll<HTMLButtonElement>('button'))
      .find((button) => button.textContent?.includes('Comprobar'))!
      .click();
    fixture.detectChanges();

    expect(finished).toEqual([1]);
    expect(element.querySelector('.quiz__score')?.textContent).toContain('1 de 2');
  });

  it('compares outputs as leniently as the grader', () => {
    expect(sameOutput('a\nb\n', 'a  \nb')).toBe(true);
    expect(sameOutput('a b', 'a  b')).toBe(false);
  });
});
