import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { MarkdownComponent } from './markdown.component';
import { glossaryLinker, renderMarkdown, slugify } from './markdown-renderer';

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
    await TestBed.configureTestingModule({
      imports: [MarkdownComponent],
      providers: [provideRouter([])],
    }).compileComponents();
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

  it('turns only complete programs into runnable examples', () => {
    render(LESSON);

    expect(element.querySelectorAll('app-runnable-example')).toHaveLength(1);
    expect(element.querySelectorAll('.hljs-keyword').length).toBeGreaterThan(0);
  });

  it('shows no runnable examples when not runnable', () => {
    render(LESSON, false);

    expect(element.querySelector('app-runnable-example')).toBeNull();
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

describe('renderMarkdown', () => {
  const html = (source: string) =>
    renderMarkdown(source)
      .segments.map((segment) => (segment.kind === 'html' ? segment.html : ''))
      .join('');

  it('turns [!tipo] quotes into titled callouts and leaves plain quotes alone', () => {
    const rendered = html('> [!analogia]\n> Una variable es una caja.\n\n> Una cita.');

    expect(rendered).toContain('<aside class="callout callout--analogia">');
    expect(rendered).toContain('Piénsalo así');
    expect(rendered).toContain('<p>Una variable es una caja.</p>');
    expect(rendered).toContain('<blockquote>');
  });

  it('draws memoria blocks with numbered references', () => {
    const rendered = html('```memoria\nstack main\nnombre: @a\nheap\n@a String: "Ana"\n```');

    expect(rendered).toContain('class="memory"');
    expect(rendered).toContain('memory__badge">1');
    expect(rendered).toContain('&quot;Ana&quot;');
  });

  it('keeps mermaid diagrams apart for their component', () => {
    const { segments } = renderMarkdown('Texto\n\n```mermaid\nflowchart TD\nA-->B\n```');

    expect(segments.map((segment) => segment.kind)).toEqual(['html', 'mermaid']);
  });
});

describe('glossaryLinker', () => {
  const explain = glossaryLinker([
    { term: 'variable', aliases: ['variables'], definition: 'Una caja con nombre.' },
  ]);

  it('explains the first appearance only, outside code and headings', () => {
    const result = explain(
      '<h2>Variables</h2><p>Una <code>variable</code> es… Las variables y otra variable.</p>',
    );

    expect(result.match(/class="term"/g)).toHaveLength(1);
    expect(result).toContain('<h2>Variables</h2>');
    expect(result).toContain('<code>variable</code>');
    expect(result).toContain('data-definition="Una caja con nombre.">variables</span>');
  });
});
