import { TestBed } from '@angular/core/testing';

import { parseScreen } from '../markdown/markdown-renderer';
import { ScreenPreviewComponent } from './screen-preview.component';

describe('ScreenPreviewComponent', () => {
  it('shows the page in a sandboxed frame without scripts, with its address', async () => {
    await TestBed.configureTestingModule({ imports: [ScreenPreviewComponent] }).compileComponents();
    const fixture = TestBed.createComponent(ScreenPreviewComponent);
    fixture.componentRef.setInput('html', '<h1>Hola, Ada</h1>');
    fixture.componentRef.setInput('url', 'localhost:4200/perfil');
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const frame = element.querySelector('iframe')!;

    expect(frame.getAttribute('sandbox')).toBe('allow-same-origin');
    expect(frame.getAttribute('srcdoc')).toContain('<h1>Hola, Ada</h1>');
    expect(element.querySelector('.screen__url')?.textContent).toBe('localhost:4200/perfil');
  });

  it('reads the address from an @url first line', () => {
    expect(parseScreen('@url /tareas\n<p>3 tareas</p>')).toEqual({
      url: '/tareas',
      html: '<p>3 tareas</p>',
    });
    expect(parseScreen('<p>Hola</p>').url).toBe('localhost:4200');
  });
});
