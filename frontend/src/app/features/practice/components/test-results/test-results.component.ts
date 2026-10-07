import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { SubmissionResult } from '../../../../core/models/exercise.model';
import { SUBMISSION_LABELS, TEST_OUTCOME_LABELS } from '../../../../shared/utils/labels';

/** The verdict of a submission and how each test case went. */
@Component({
  selector: 'app-test-results',
  templateUrl: './test-results.component.html',
  styleUrl: './test-results.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestResultsComponent {
  readonly result = input.required<SubmissionResult>();

  protected readonly statusLabels = SUBMISSION_LABELS;
  protected readonly outcomeLabels = TEST_OUTCOME_LABELS;
}
