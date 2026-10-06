import { TestBed } from '@angular/core/testing';

import { CodePreviewComponent } from './code-preview.component';
import { SAMPLE_OUTPUT, SAMPLE_SOURCE } from './code-preview.sample';

describe('CodePreviewComponent', () => {
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CodePreviewComponent] }).compileComponents();
    const fixture = TestBed.createComponent(CodePreviewComponent);
    fixture.detectChanges();
    element = fixture.nativeElement as HTMLElement;
  });

  it('renders every source line with its exact text', () => {
    const rendered = Array.from(element.querySelectorAll('.preview__line code')).map(
      (line) => line.textContent,
    );
    const expected = SAMPLE_SOURCE.map((line) => line.map((token) => token.text).join(''));

    expect(rendered).toEqual(expected);
  });

  it('shows the program output in the console, apart from the source', () => {
    const consoleText = element.querySelector('.preview__console')?.textContent ?? '';
    const sourceText = element.querySelector('.preview__source')?.textContent ?? '';

    expect(consoleText).toContain(SAMPLE_OUTPUT[0]);
    expect(sourceText).not.toContain(SAMPLE_OUTPUT[0]);
  });
});
