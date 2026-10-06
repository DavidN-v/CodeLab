import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { PagePlaceholderComponent } from './page-placeholder.component';

describe('PagePlaceholderComponent', () => {
  it('describes the upcoming page and when it arrives', async () => {
    await TestBed.configureTestingModule({
      imports: [PagePlaceholderComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(PagePlaceholderComponent);
    fixture.componentRef.setInput('heading', 'Panel');
    fixture.componentRef.setInput('description', 'Tu progreso y tus próximos objetivos.');
    fixture.componentRef.setInput('phase', 2);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('h1')?.textContent).toBe('Panel');
    expect(element.textContent).toContain('Tu progreso y tus próximos objetivos.');
    expect(element.querySelector('.placeholder__status')?.textContent).toContain('Fase 2');
    expect(element.querySelector('a')?.getAttribute('href')).toBe('/');
  });
});
