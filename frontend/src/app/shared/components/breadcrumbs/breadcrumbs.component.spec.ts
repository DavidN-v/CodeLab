import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { BreadcrumbsComponent } from './breadcrumbs.component';

describe('BreadcrumbsComponent', () => {
  it('links every crumb but the current page', async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbsComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(BreadcrumbsComponent);
    fixture.componentRef.setInput('crumbs', [
      { label: 'Java desde cero', link: ['/languages', 'java'] },
      { label: 'Módulo 1 · Fundamentos', link: '/languages/java/modules/fundamentos' },
      { label: 'Lección 2 de 7' },
    ]);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    const links = [...element.querySelectorAll('a')].map((link) => link.getAttribute('href'));
    expect(links).toEqual(['/languages/java', '/languages/java/modules/fundamentos']);
    expect(element.querySelector('[aria-current="page"]')?.textContent).toBe('Lección 2 de 7');
  });
});
