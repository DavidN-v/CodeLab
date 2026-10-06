import { ChangeDetectionStrategy, Component } from '@angular/core';

import { LEARNING_STEPS } from './learning-flow.steps';

@Component({
  selector: 'app-learning-flow',
  templateUrl: './learning-flow.component.html',
  styleUrl: './learning-flow.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LearningFlowComponent {
  protected readonly steps = LEARNING_STEPS;
}
