import { TestBed } from '@angular/core/testing';

import { SubmissionResult } from '../../../../core/models/exercise.model';
import { TestResultsComponent } from './test-results.component';

const RESULT: SubmissionResult = {
  id: 1,
  status: 'WRONG_ANSWER',
  passedTests: 1,
  totalTests: 3,
  executionTimeMs: 90,
  compileOutput: null,
  firstSolve: false,
  feedback: null,
  reviewPassed: false,
  celebration: null,
  xpAwarded: 0,
  tests: [
    {
      position: 1,
      sample: true,
      outcome: 'PASSED',
      input: '1',
      expectedOutput: '1\n',
      actualOutput: '1\n',
      stderr: '',
    },
    {
      position: 2,
      sample: true,
      outcome: 'WRONG_OUTPUT',
      input: '2',
      expectedOutput: '4\n',
      actualOutput: '5\n',
      stderr: '',
    },
    {
      position: 3,
      sample: false,
      outcome: 'WRONG_OUTPUT',
      input: null,
      expectedOutput: null,
      actualOutput: null,
      stderr: null,
    },
  ],
};

describe('TestResultsComponent', () => {
  it('shows the verdict and the details of failing sample cases only', async () => {
    await TestBed.configureTestingModule({ imports: [TestResultsComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TestResultsComponent);
    fixture.componentRef.setInput('result', RESULT);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('.results__status')?.textContent?.trim()).toBe(
      'Respuesta incorrecta',
    );
    expect(element.querySelector('.results__count')?.textContent).toContain('1 / 3');
    expect(element.querySelectorAll('.test__detail')).toHaveLength(1);
    expect(element.querySelector('.test__detail')?.textContent).toContain('5');
    expect(element.textContent).toContain('Prueba 3 (oculta)');
  });
});
