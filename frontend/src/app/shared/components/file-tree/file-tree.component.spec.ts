import { TestBed } from '@angular/core/testing';

import { FileTreeComponent } from './file-tree.component';
import { fileBadge, parseTree } from './file-tree';

const SOURCE = `mi-app/            # El proyecto
  src/             # Tu código
    main.ts        # Arranca Angular
    app/
      app.ts       # El componente raíz
  package.json     # Librerías y comandos
`;

describe('parseTree', () => {
  it('reads names, levels, folders, paths and descriptions', () => {
    const entries = parseTree(SOURCE);

    expect(entries.map((e) => e.path)).toEqual([
      'mi-app',
      'mi-app/src',
      'mi-app/src/main.ts',
      'mi-app/src/app',
      'mi-app/src/app/app.ts',
      'mi-app/package.json',
    ]);
    expect(entries[1]).toMatchObject({ folder: true, depth: 1, description: 'Tu código' });
    expect(entries[3].description).toBe('');
  });

  it('labels files by kind', () => {
    expect(fileBadge('app.spec.ts')).toBe('TEST');
    expect(fileBadge('app.html')).toBe('HTML');
    expect(fileBadge('.gitignore')).toBe('CFG');
  });
});

describe('FileTreeComponent', () => {
  it('explains the chosen file and folds folders', async () => {
    await TestBed.configureTestingModule({ imports: [FileTreeComponent] }).compileComponents();
    const fixture = TestBed.createComponent(FileTreeComponent);
    fixture.componentRef.setInput('source', SOURCE);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const entry = (name: string) =>
      [...element.querySelectorAll<HTMLButtonElement>('.tree__entry')].find((b) =>
        b.textContent?.includes(name),
      )!;

    entry('main.ts').click();
    fixture.detectChanges();
    expect(element.querySelector('.tree__description')?.textContent).toContain('Arranca Angular');

    entry('src/').click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.tree__entry')).toHaveLength(3);
  });
});
