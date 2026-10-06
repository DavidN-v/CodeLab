import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarkdownComponent } from './markdown.component';
import { slugify } from './markdown-renderer';

const LESSON = `Intro con \`código\`.

## Primer paso

\`\`\`java
public class Main {
    public static void main(String[] args) {
        System.out.println("Hola");
    }
}
\`\`\`

## Primer paso

\`\`\`java fragment
public static void main(String[] args) { ... }
\`\`\`

<script>alert('x')</script>
`;

describe('MarkdownComponent', () => {
  let fixture: ComponentFixture<MarkdownComponent>;
  let element: HTMLElement;

  function render(content: string, runnable = true): void {
    fixture.componentRef.setInput('content', content);
    fixture.componentRef.setInput('runnable', runnable);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [MarkdownComponent] }).compileComponents();
    fixture = TestBed.createComponent(MarkdownComponent);
    element = fixture.nativeElement as HTMLElement;
  });

  it('renders headings with unique ids and lists them', () => {
    render(LESSON);

    const ids = Array.from(element.querySelectorAll('h2')).map((heading) => heading.id);
    expect(ids).toEqual(['primer-paso', 'primer-paso-2']);
    expect(fixture.componentInstance.headings()).toEqual([
      { id: 'primer-paso', text: 'Primer paso' },
      { id: 'primer-paso-2', text: 'Primer paso' },
    ]);
  });

  it('highlights Java and offers only complete programs to the playground', () => {
    render(LESSON);

    expect(element.querySelectorAll('.hljs-keyword').length).toBeGreaterThan(0);
    expect(element.querySelectorAll('.prose__run')).toHaveLength(1);
  });

  it('emits the code of the example that was opened', () => {
    render(LESSON);
    const emitted: string[] = [];
    fixture.componentInstance.runCode.subscribe((code) => emitted.push(code));

    element.querySelector<HTMLButtonElement>('.prose__run')!.click();

    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toContain('System.out.println("Hola");');
  });

  it('shows no run buttons when not runnable', () => {
    render(LESSON, false);

    expect(element.querySelector('.prose__run')).toBeNull();
  });

  it('escapes raw HTML instead of rendering it', () => {
    render(LESSON);

    expect(element.querySelector('script')).toBeNull();
    expect(element.textContent).toContain("<script>alert('x')</script>");
  });

  it('slugifies accented headings', () => {
    expect(slugify('¿Qué es `Java`?')).toBe('que-es-java');
  });
});
