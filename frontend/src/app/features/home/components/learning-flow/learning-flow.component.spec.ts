import { TestBed } from '@angular/core/testing';

import { LearningFlowComponent } from './learning-flow.component';

describe('LearningFlowComponent', () => {
  it('lists the four steps in order, numbered', async () => {
    await TestBed.configureTestingModule({ imports: [LearningFlowComponent] }).compileComponents();
    const fixture = TestBed.createComponent(LearningFlowComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const labels = Array.from(element.querySelectorAll('.flow__label')).map((l) => l.textContent);
    const indexes = Array.from(element.querySelectorAll('.flow__index')).map((i) => i.textContent);

    expect(labels).toEqual(['Aprende', 'Practica', 'Ejecuta', 'Domina']);
    expect(indexes).toEqual(['01', '02', '03', '04']);
  });
});
