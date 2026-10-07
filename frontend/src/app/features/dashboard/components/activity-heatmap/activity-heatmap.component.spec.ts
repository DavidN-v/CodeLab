import { TestBed } from '@angular/core/testing';

import { ActivityDay } from '../../../../core/models/dashboard.model';
import { ActivityHeatmapComponent } from './activity-heatmap.component';

describe('ActivityHeatmapComponent', () => {
  it('lays days out in weeks and shades them by activity', async () => {
    const days: ActivityDay[] = Array.from({ length: 14 }, (_, index) => ({
      date: `2026-09-${String(index + 1).padStart(2, '0')}`,
      count: index === 13 ? 12 : index === 0 ? 1 : 0,
    }));
    await TestBed.configureTestingModule({
      imports: [ActivityHeatmapComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(ActivityHeatmapComponent);
    fixture.componentRef.setInput('days', days);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.heatmap__week')).toHaveLength(2);
    expect(element.querySelector('.heatmap__grid')?.getAttribute('aria-label')).toContain('2 días');
    expect(element.querySelectorAll('.heatmap__grid [data-level="4"]')).toHaveLength(1);
  });
});
