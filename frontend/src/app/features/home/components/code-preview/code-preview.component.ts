import { ChangeDetectionStrategy, Component } from '@angular/core';

import {
  SAMPLE_COMMAND,
  SAMPLE_FILE_NAME,
  SAMPLE_OUTPUT,
  SAMPLE_SOURCE,
} from './code-preview.sample';

/** Non-interactive editor-and-console illustration shown in the landing hero. */
@Component({
  selector: 'app-code-preview',
  templateUrl: './code-preview.component.html',
  styleUrl: './code-preview.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CodePreviewComponent {
  protected readonly fileName = SAMPLE_FILE_NAME;
  protected readonly lines = SAMPLE_SOURCE;
  protected readonly command = SAMPLE_COMMAND;
  protected readonly output = SAMPLE_OUTPUT;
}
