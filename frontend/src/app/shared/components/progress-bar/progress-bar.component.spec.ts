import { TestBed } from '@angular/core/testing';

import { ProgressBarComponent } from './progress-bar.component';

describe('ProgressBarComponent', () => {
  it('exposes a clamped value to assistive technology', async () => {
    await TestBed.configureTestingModule({ imports: [ProgressBarComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ProgressBarComponent);
    fixture.componentRef.setInput('percent', 140);
    fixture.componentRef.setInput('label', 'Progreso del curso');
    fixture.detectChanges();

    const bar = (fixture.nativeElement as HTMLElement).querySelector('[role="progressbar"]')!;
    expect(bar.getAttribute('aria-valuenow')).toBe('100');
    expect(bar.getAttribute('aria-label')).toBe('Progreso del curso');
  });
});
