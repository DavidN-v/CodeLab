/** One line of an `arbol` block. */
export interface TreeEntry {
  name: string;
  depth: number;
  folder: boolean;
  /** What the file or folder is for; empty when the lesson does not say. */
  description: string;
  /** Path from the root, e.g. `mi-app/src/main.ts`. */
  path: string;
}

/**
 * Parses an `arbol` block: two spaces per level, folders end in `/`, and an
 * optional `# description` after the name. See docs/CONTENT.md.
 */
export function parseTree(source: string): TreeEntry[] {
  const entries: TreeEntry[] = [];
  const parents: string[] = [];
  for (const line of source.split('\n')) {
    if (!line.trim()) {
      continue;
    }
    const indent = line.length - line.trimStart().length;
    const depth = Math.floor(indent / 2);
    const hash = line.indexOf('#', indent);
    const name = (hash >= 0 ? line.slice(indent, hash) : line.slice(indent)).trim();
    const description = hash >= 0 ? line.slice(hash + 1).trim() : '';
    parents.length = depth;
    const clean = name.replace(/\/$/, '');
    entries.push({
      name: clean,
      depth,
      folder: name.endsWith('/'),
      description,
      path: [...parents, clean].join('/'),
    });
    parents.push(clean);
  }
  return entries;
}

/** A short badge for the kind of file: TS, HTML, CSS… */
export function fileBadge(name: string): string {
  const extension = /\.([a-z0-9]+)$/i.exec(name)?.[1]?.toLowerCase() ?? '';
  if (name.endsWith('.spec.ts')) {
    return 'TEST';
  }
  const badges: Record<string, string> = {
    ts: 'TS',
    js: 'JS',
    mjs: 'JS',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    json: 'JSON',
    md: 'MD',
    ico: 'ICO',
    png: 'IMG',
    svg: 'SVG',
    yml: 'YML',
    yaml: 'YML',
  };
  return badges[extension] ?? (name.startsWith('.') ? 'CFG' : 'FILE');
}
