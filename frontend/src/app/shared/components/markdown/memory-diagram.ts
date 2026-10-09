/**
 * Draws a ```memoria block (see docs/CONTENT.md) as HTML: the call stack with
 * its variables on the left, the objects on the heap on the right, and
 * references as numbered arrows.
 *
 *     stack main
 *     edad: 30
 *     nombre: @1
 *     heap
 *     @1 String: "Ana"
 *     @2 int[]: [1, 2, 3]
 *     @3 Persona: nombre=@1, edad=30
 */

interface Frame {
  name: string;
  vars: [string, string][];
}

interface HeapEntry {
  id: string;
  type: string;
  content: string;
}

export function renderMemoryDiagram(source: string): string {
  const frames: Frame[] = [];
  const heap: HeapEntry[] = [];
  let section: 'stack' | 'heap' | null = null;
  for (const raw of source.split('\n')) {
    const line = raw.trim();
    if (!line) {
      continue;
    }
    if (line === 'heap') {
      section = 'heap';
      continue;
    }
    const frame = /^stack\s*(.*)$/.exec(line);
    if (frame) {
      section = 'stack';
      frames.push({ name: frame[1] || 'main', vars: [] });
      continue;
    }
    if (section === 'stack' && frames.length > 0) {
      const separator = line.indexOf(':');
      if (separator > 0) {
        frames[frames.length - 1].vars.push([
          line.slice(0, separator).trim(),
          line.slice(separator + 1).trim(),
        ]);
      }
    } else if (section === 'heap') {
      const entry = /^@([\w-]+)\s+([^:]+):\s*(.*)$/.exec(line);
      if (entry) {
        heap.push({ id: entry[1], type: entry[2].trim(), content: entry[3] });
      }
    }
  }

  const numbers = new Map(heap.map((entry, index) => [entry.id, index + 1]));
  const value = (text: string) => renderValue(text, numbers);

  const stack = [...frames]
    .reverse()
    .map(
      (frame, index) =>
        `<div class="memory__frame${index === 0 ? ' memory__frame--top' : ''}"><p class="memory__frame-name">${escape(frame.name)}</p>` +
        (frame.vars.length === 0
          ? '<p class="memory__empty">sin variables</p>'
          : `<table class="memory__vars"><tbody>${frame.vars
              .map(
                ([name, text]) =>
                  `<tr><th scope="row">${escape(name)}</th><td>${value(text)}</td></tr>`,
              )
              .join('')}</tbody></table>`) +
        '</div>',
    )
    .join('');

  const objects = heap
    .map(
      (entry) =>
        `<div class="memory__object"><p class="memory__object-head"><span class="memory__badge">${numbers.get(entry.id)}</span>${escape(entry.type)}</p>${renderContent(entry, value)}</div>`,
    )
    .join('');

  return (
    '<figure class="memory" aria-label="Diagrama de memoria">' +
    `<div class="memory__side"><p class="memory__title">Pila · variables</p>${stack || '<p class="memory__empty">vacía</p>'}</div>` +
    (heap.length > 0
      ? `<div class="memory__side"><p class="memory__title">Montón · objetos</p>${objects}</div>`
      : '') +
    '</figure>\n'
  );
}

function renderContent(entry: HeapEntry, value: (text: string) => string): string {
  const content = entry.content.trim();
  // An array or list: [1, 2, 3] drawn as numbered cells.
  if (content.startsWith('[') && content.endsWith(']')) {
    const items = splitTopLevel(content.slice(1, -1));
    return `<div class="memory__cells">${items
      .map(
        (item, index) =>
          `<div class="memory__cell"><span class="memory__index">${index}</span><span>${value(item)}</span></div>`,
      )
      .join('')}</div>`;
  }
  // An object: field=value pairs.
  if (/^[\w$]+\s*=/.test(content)) {
    const fields = splitTopLevel(content).map((field) => {
      const at = field.indexOf('=');
      return [field.slice(0, at).trim(), field.slice(at + 1).trim()] as const;
    });
    return `<table class="memory__vars"><tbody>${fields
      .map(([name, text]) => `<tr><th scope="row">${escape(name)}</th><td>${value(text)}</td></tr>`)
      .join('')}</tbody></table>`;
  }
  return `<p class="memory__text">${value(content)}</p>`;
}

function renderValue(text: string, numbers: Map<string, number>): string {
  const reference = /^@([\w-]+)$/.exec(text);
  if (reference) {
    const number = numbers.get(reference[1]);
    return `<span class="memory__ref" title="Apunta al objeto ${number ?? '?'}">→ <span class="memory__badge">${number ?? '?'}</span></span>`;
  }
  if (text === 'null') {
    return '<span class="memory__null">null</span>';
  }
  if (/^".*"$/.test(text) || /^'.'$/.test(text)) {
    return `<span class="memory__string">${escape(text)}</span>`;
  }
  return `<span class="memory__value">${escape(text)}</span>`;
}

/** Splits on commas that are not inside quotes or brackets. */
function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let quote: string | null = null;
  let current = '';
  for (const char of text) {
    if (quote) {
      if (char === quote) {
        quote = null;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '[' || char === '{' || char === '(') {
      depth++;
    } else if (char === ']' || char === '}' || char === ')') {
      depth--;
    } else if (char === ',' && depth === 0) {
      parts.push(current.trim());
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) {
    parts.push(current.trim());
  }
  return parts;
}

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
